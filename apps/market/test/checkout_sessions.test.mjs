import { test, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { startFakeSanity } from './helpers/fakeSanity.mjs'
import { makeRes } from './helpers/fakeRes.mjs'

// The checkout handler is the money path: it turns a BRIET catalog book into a
// Stripe Checkout session. No module mocks: Sanity runs against a fake Content
// Lake via the real client, and Stripe is an injected capture of the one call the
// handler makes — the two real boundaries. Currency conversion and metadata
// wiring in between run for real.

const fake = await startFakeSanity()
after(() => fake.close())
beforeEach(() => fake.reset())

const { default: handler } = await import('../pages/api/checkout_sessions.ts')

// The catalog query dereferences publisher->name and cover.asset->url, so seed the
// book with reference-shaped fields (as Content Lake stores them) plus their targets.
const COVER_URL = 'https://cdn.sanity.io/images/p/production/abc123-600x900.jpg'
const seededPublisher = { _id: 'publisher-1', _type: 'publisher', name: 'Test Press' }
const seededCoverAsset = { _id: 'image-abc123-600x900-jpg', _type: 'sanity.imageAsset', url: COVER_URL }
const seededBook = {
  _id: 'book-1',
  _type: 'book',
  title: 'The Test Book',
  price_usd: 25,
  publisher: { _type: 'reference', _ref: 'publisher-1' },
  cover: { _type: 'image', asset: { _type: 'reference', _ref: 'image-abc123-600x900-jpg' } },
}

let sessionParams
const stripeCapture = {
  checkout: {
    sessions: {
      create: async (params) => {
        sessionParams = params
        return { url: 'https://checkout.stripe.com/c/pay/cs_test_123' }
      },
    },
  },
}

const post = async (briet_item_id) => {
  const res = makeRes()
  await handler(
    { method: 'POST', body: { briet_item_id }, headers: { origin: 'https://market.briet.app' } },
    res,
    { sanity: fake.client(), stripe: stripeCapture }
  )
  return res
}

beforeEach(() => {
  sessionParams = undefined
  fake.reset()
  fake.seed([seededPublisher, seededCoverAsset, seededBook])
})

test('POST builds a Stripe session from the catalog book and redirects to it', async () => {
  const res = await post('book-1')

  const item = sessionParams.line_items[0]
  assert.equal(sessionParams.mode, 'payment')
  assert.equal(item.price_data.currency, 'usd')
  assert.equal(item.price_data.unit_amount, 2500) // $25 -> cents, via the real formatter
  assert.equal(item.price_data.product_data.name, 'The Test Book')
  assert.deepEqual(item.price_data.product_data.images, [COVER_URL])
  assert.equal(item.adjustable_quantity.minimum, 1)

  // publisher rides along for manual payout
  assert.equal(sessionParams.payment_intent_data.metadata.briet_payout_to, 'Test Press')

  // the order page reads this back to know which book to mint a code for
  assert.equal(sessionParams.metadata.briet_item_id, 'book-1')

  // redirect URLs are anchored to the configured site and book id
  assert.equal(sessionParams.success_url, 'https://market.briet.app/order/{CHECKOUT_SESSION_ID}')
  assert.equal(sessionParams.cancel_url, 'https://market.briet.app/buy/book-1')

  // user is sent to the Stripe-hosted page
  assert.equal(res.statusCode, 303)
  assert.equal(res.redirectUrl, 'https://checkout.stripe.com/c/pay/cs_test_123')
})

test('an unknown book id gives a clean 404, no Stripe call', async () => {
  const res = await post('does-not-exist')

  assert.equal(res.statusCode, 404)
  assert.equal(sessionParams, undefined) // never reached Stripe
  assert.deepEqual(res.body, { error: 'not_found' })
})

test('non-POST is rejected with 405 and an Allow header', async () => {
  const res = makeRes()
  await handler({ method: 'GET', headers: {} }, res, { sanity: fake.client(), stripe: stripeCapture })

  assert.equal(res.statusCode, 405)
  assert.equal(res.headers['Allow'], 'POST')
  assert.equal(sessionParams, undefined) // no Stripe call attempted
})
