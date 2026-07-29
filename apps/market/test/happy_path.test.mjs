import { test, mock, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { createClient } from '@sanity/client'

// One purchase, end to end: buy a book, mint the code the receipt shows, redeem
// it in Lenny. The three handlers are only ever wired together in production, so
// this is what catches a seam coming loose between them — a renamed metadata key,
// a code format one side won't accept, a claim that reports the wrong thing.
//
// Stripe is stubbed (its hosted card page cannot be driven from a test). Sanity
// is not: the real @sanity/client talks to the fake HTTP API below, which stores
// documents and hand-projects the two queries it serves, since it cannot run GROQ.

const BOOK_ID = 'book-1'
const SESSION_ID = 'cs_test_happypath'
const docs = new Map([[BOOK_ID, {
  _id: BOOK_ID,
  title: 'The Test Book',
  publisher_name: 'Test Press',
  coverImageUrl: 'https://cdn.sanity.io/images/p/production/cover.jpg',
  price_usd: 25,
  olid: 'OL32941311M',
  fileUrl: 'https://cdn.sanity.io/files/p/production/book.epub',
}]])

const server = http.createServer((req, res) => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    const url = new URL(req.url, 'http://localhost')
    res.setHeader('Content-Type', 'application/json')

    if (url.pathname.includes('/data/query/')) {
      const query = url.searchParams.get('query')
      const param = (name) => JSON.parse(url.searchParams.get(`$${name}`))
      if (query.includes('_type == "book"')) {
        return res.end(JSON.stringify({ result: docs.get(param('id')) ?? null }))
      }
      const code = param('code')
      const found = [...docs.values()].find((d) => d._type === 'redeemCode' && d.code === code)
      return res.end(JSON.stringify({
        result: found ? {
          _id: found._id,
          redeemedAt: found.redeemedAt ?? null,
          books: found.books.map(({ _ref }) => {
            const book = docs.get(_ref)
            return { olid: book.olid, title: book.title, url: book.fileUrl }
          }),
        } : null,
      }))
    }

    const [mutation] = JSON.parse(body).mutations
    if (mutation.createIfNotExists) {
      const doc = mutation.createIfNotExists
      if (!docs.has(doc._id)) docs.set(doc._id, doc)
      const stored = docs.get(doc._id)
      return res.end(JSON.stringify({ results: [{ id: stored._id, document: stored }] }))
    }

    const { patch } = mutation
    const target = docs.get(patch.params.id)
    const matched = target && !target.redeemedAt
    if (matched) target.redeemedAt = patch.set.redeemedAt
    res.end(JSON.stringify({ results: matched ? [{ id: target._id }] : [] }))
  })
})

await new Promise((resolve) => server.listen(0, resolve))
const { port } = server.address()

process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
process.env.SITE_URL = 'https://market.briet.app'

let sessionParams
class MockStripe {
  constructor() {
    this.checkout = {
      sessions: {
        create: async (params) => {
          sessionParams = params
          return { url: 'https://pay.briet.app/c/pay/cs_test_happypath' }
        },
      },
    }
  }
}
mock.module('stripe', { defaultExport: MockStripe })

const sanity = createClient({
  projectId: 'p',
  dataset: 'd',
  apiVersion: '2025-11-18',
  token: 't',
  apiHost: `http://localhost:${port}`,
  useProjectHostname: false,
})
mock.module('@repo/sanity-client', {
  defaultExport: sanity,
  namedExports: { createSanityClient: () => sanity, createSanityWriteClient: () => sanity },
})

after(() => server.close())

const { default: checkout } = await import('../pages/api/checkout_sessions.ts')
const { default: redeem } = await import('../pages/api/redeem-lenny/[code].ts')
const { mintRedeemCode } = await import('../lib/redeemCode.ts')

const makeRes = () => {
  const res = { statusCode: null, body: null, redirectUrl: null, headers: {} }
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (body) => { res.body = body; return res }
  res.redirect = (code, url) => { res.statusCode = code; res.redirectUrl = url; return res }
  res.setHeader = (key, value) => { res.headers[key] = value; return res }
  res.end = (body) => { res.body = body; return res }
  return res
}

test('buy a book, mint the code on the receipt, redeem it in Lenny', async () => {
  const checkoutRes = makeRes()
  await checkout({ method: 'POST', body: { briet_item_id: BOOK_ID }, headers: {} }, checkoutRes)
  assert.equal(checkoutRes.statusCode, 303)

  // Stripe hands the buyer back to the order page, carrying the book id there
  assert.equal(sessionParams.success_url, 'https://market.briet.app/order/{CHECKOUT_SESSION_ID}')

  // what Stripe reports once the card clears
  const paidSession = {
    id: SESSION_ID,
    payment_status: 'paid',
    metadata: sessionParams.metadata,
    customer_details: { email: 'librarian@example.org' },
  }

  const code = await mintRedeemCode(paidSession)
  assert.match(code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/)

  const redeemed = makeRes()
  await redeem({ method: 'GET', query: { code } }, redeemed)

  assert.equal(redeemed.statusCode, 200)
  assert.deepEqual(redeemed.body, {
    books: [{
      olid: 'OL32941311M',
      title: 'The Test Book',
      url: 'https://cdn.sanity.io/files/p/production/book.epub',
    }],
  })

  // and the code is spent, so a second import cannot ride the same purchase
  const replay = makeRes()
  await redeem({ method: 'GET', query: { code } }, replay)
  assert.equal(replay.statusCode, 400)
  assert.deepEqual(replay.body, { error: 'already_redeemed' })
})
