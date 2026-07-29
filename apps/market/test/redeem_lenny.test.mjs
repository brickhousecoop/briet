import { test, mock, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { createClient } from '@sanity/client'

// Lenny GETs this with a one-time code and imports whatever books come back.
// The code is a bearer token spent on first use, so the status codes and the
// one-shot claim are the contract.
//
// The boundary here is Sanity's HTTP API, not its client: the real @sanity/client
// runs against the fake server below. Stubbing the client instead would let a
// misread of its return contract pass — which is exactly how the claim shipped
// broken once, always reporting "already redeemed" after spending the code.
// The fake server decides the conditional match itself, so this covers the
// request and response contract but not whether the GROQ predicate is valid.

let record // the stored redeemCode document, or null
let claims // one entry per mutation the server actually matched

const server = http.createServer((req, res) => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    const url = new URL(req.url, 'http://localhost')
    res.setHeader('Content-Type', 'application/json')

    if (url.pathname.includes('/data/query/')) {
      return res.end(JSON.stringify({ ms: 1, result: record }))
    }

    const { patch } = JSON.parse(body).mutations[0]
    const matched = record && !record.redeemedAt && patch.params.id === record._id
    if (matched) {
      record.redeemedAt = patch.set.redeemedAt
      claims.push(patch.params.id)
    }
    res.end(JSON.stringify({
      transactionId: 'tx1',
      results: matched ? [{ id: record._id, operation: 'update' }] : [],
    }))
  })
})

await new Promise((resolve) => server.listen(0, resolve))
const { port } = server.address()

mock.module('@repo/sanity-client', {
  namedExports: {
    createSanityWriteClient: () => sanityFor({}),
    createSanityClient: (overrides = {}) => sanityFor(overrides),
  },
})

function sanityFor(overrides) {
  return createClient({
      projectId: 'p',
      dataset: 'd',
      apiVersion: '2025-11-18',
      token: 't',
    apiHost: `http://localhost:${port}`,
    useProjectHostname: false,
    ...overrides,
  })
}

after(() => server.close())

const { default: handler } = await import('../pages/api/redeem-lenny/[code].ts')

const makeRes = () => {
  const res = { statusCode: null, body: null, headers: {} }
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (body) => { res.body = body; return res }
  res.setHeader = (key, value) => { res.headers[key] = value; return res }
  res.end = (body) => { res.body = body; return res }
  return res
}

const get = async (code) => {
  const res = makeRes()
  await handler({ method: 'GET', query: { code } }, res)
  return res
}

const importableBook = {
  olid: 'OL32941311M',
  title: 'The Test Book',
  url: 'https://cdn.sanity.io/files/p/production/book.epub',
}

beforeEach(() => {
  claims = []
  record = { _id: 'redeem-cs_test_123', redeemedAt: null, books: [importableBook] }
})

test('a valid code returns its books and is spent in the same request', async () => {
  const res = await get('abcd-1234')

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { books: [importableBook] })
  assert.deepEqual(claims, ['redeem-cs_test_123'])
})

test('reusing a spent code is rejected, and the books are not returned again', async () => {
  await get('abcd-1234')
  const res = await get('abcd-1234')

  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { error: 'already_redeemed' })
  assert.deepEqual(claims, ['redeem-cs_test_123']) // claimed exactly once
})

test('an unknown code is a 404', async () => {
  record = null
  const res = await get('nope-nope')

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { error: 'not_found' })
})

test('books Lenny cannot import are dropped rather than returned half-formed', async () => {
  record.books = [importableBook, { olid: null, url: 'x' }, { olid: 'OL1M', url: null }]
  const res = await get('abcd-1234')

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { books: [importableBook] })
})

test('a bundle with nothing importable fails without burning the code', async () => {
  record.books = [{ olid: null, url: null }]
  const res = await get('abcd-1234')

  assert.equal(res.statusCode, 422)
  assert.deepEqual(res.body, { error: 'nothing_to_import' })

  // the cataloguing gap is fixable in the Studio; the purchase must survive it
  assert.deepEqual(claims, [])
  assert.equal(record.redeemedAt, null)
})

test('non-GET is rejected with 405 and an Allow header', async () => {
  const res = makeRes()
  await handler({ method: 'POST', query: {} }, res)

  assert.equal(res.statusCode, 405)
  assert.equal(res.headers['Allow'], 'GET')
})
