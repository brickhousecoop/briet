import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// The checkout handler is the money path: it turns a BRIET catalog book into a
// Stripe Checkout session. We mock only the two real boundaries — the Sanity
// catalog (source of the book) and the Stripe SDK (the network call) — and
// assert the session Stripe receives is built correctly. Everything in between
// (currency conversion, metadata wiring) runs for real.

process.env.STRIPE_SECRET_KEY = 'sk_test_fake'

const fakeBook = {
  _id: 'book-1',
  title: 'The Test Book',
  publisher_name: 'Test Press',
  coverImageUrl: 'https://cdn.sanity.io/images/p/production/cover.jpg',
  price_usd: 25,
}

let fetchParams
let sessionParams
let bookResult // what the mocked Sanity catalog returns for a fetch

mock.module('@repo/sanity-client', {
  defaultExport: {
    fetch: async (_query, params) => {
      fetchParams = params
      return bookResult
    },
  },
})

class MockStripe {
  constructor() {
    this.checkout = {
      sessions: {
        create: async (params) => {
          sessionParams = params
          return { url: 'https://checkout.stripe.com/c/pay/cs_test_123' }
        },
      },
    }
  }
}
mock.module('stripe', { defaultExport: MockStripe })

const { default: handler } = await import('../pages/api/checkout_sessions.ts')

const makeRes = () => {
  const res = { statusCode: null, redirectUrl: null, body: null, headers: {} }
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (body) => { res.body = body; return res }
  res.redirect = (code, url) => { res.statusCode = code; res.redirectUrl = url; return res }
  res.setHeader = (key, value) => { res.headers[key] = value; return res }
  res.end = (body) => { res.body = body; return res }
  return res
}

beforeEach(() => {
  fetchParams = undefined
  sessionParams = undefined
  bookResult = fakeBook
})

test('POST builds a Stripe session from the catalog book and redirects to it', async () => {
  const req = {
    method: 'POST',
    body: { briet_item_id: 'book-1' },
    headers: { origin: 'https://market.briet.app' },
  }
  const res = makeRes()
  await handler(req, res)

  // fetched the book the caller asked for
  assert.deepEqual(fetchParams, { id: 'book-1' })

  const item = sessionParams.line_items[0]
  assert.equal(sessionParams.mode, 'payment')
  assert.equal(item.price_data.currency, 'usd')
  assert.equal(item.price_data.unit_amount, 2500) // $25 -> cents, via the real formatter
  assert.equal(item.price_data.product_data.name, 'The Test Book')
  assert.deepEqual(item.price_data.product_data.images, [fakeBook.coverImageUrl])
  assert.equal(item.adjustable_quantity.minimum, 1)

  // publisher rides along for manual payout
  assert.equal(sessionParams.payment_intent_data.metadata.briet_payout_to, 'Test Press')

  // the order page reads this back to know which book to mint a code for
  assert.equal(sessionParams.metadata.briet_item_id, 'book-1')

  // redirect URLs are anchored to the request origin and book id
  assert.equal(sessionParams.success_url, 'https://market.briet.app/order/{CHECKOUT_SESSION_ID}')
  assert.equal(sessionParams.cancel_url, 'https://market.briet.app/buy/book-1')

  // user is sent to the Stripe-hosted page
  assert.equal(res.statusCode, 303)
  assert.equal(res.redirectUrl, 'https://checkout.stripe.com/c/pay/cs_test_123')
})

test('an unknown book id gives a clean 404, no Stripe call, no internals leaked', async () => {
  bookResult = null // Sanity finds nothing for this id
  const req = {
    method: 'POST',
    body: { briet_item_id: 'does-not-exist' },
    headers: { origin: 'https://market.briet.app' },
  }
  const res = makeRes()
  await handler(req, res)

  assert.equal(res.statusCode, 404)
  assert.equal(sessionParams, undefined) // never reached Stripe
  // regression: previously threw on book.price_usd and leaked the raw TypeError
  assert.equal(res.body, 'Book not found')
})

test('non-POST is rejected with 405 and an Allow header', async () => {
  const res = makeRes()
  await handler({ method: 'GET', headers: {} }, res)

  assert.equal(res.statusCode, 405)
  assert.equal(res.headers['Allow'], 'POST')
  assert.equal(sessionParams, undefined) // no Stripe call attempted
})
