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

const { default: handler } = await import('../pages/api/checkout.ts')

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

const verifiedBuyer = {
  primaryEmailAddress: { emailAddress: 'buyer@example.org', verification: { status: 'verified' } },
}

const post = async (briet_item_id, user = verifiedBuyer) => {
  const res = makeRes()
  await handler(
    { method: 'POST', body: { briet_item_id }, headers: { origin: 'https://market.briet.app' } },
    res,
    {
      sanity: fake.client(),
      stripe: stripeCapture,
      getUser: async () => user,
    }
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

  // the order page persists the same code Stripe includes on its receipt
  assert.equal(sessionParams.metadata.briet_item_id, 'book-1')
  assert.match(sessionParams.metadata.briet_redeem_code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  assert.ok(
    sessionParams.payment_intent_data.description.includes(sessionParams.metadata.briet_redeem_code),
  )

  // redirect URLs are anchored to the configured site and book id
  assert.equal(sessionParams.success_url, 'https://market.briet.app/order/{CHECKOUT_SESSION_ID}')
  assert.equal(sessionParams.cancel_url, 'https://market.briet.app/buy/book-1')

  // user is sent to the Stripe-hosted page
  assert.equal(res.statusCode, 303)
  assert.equal(res.redirectUrl, 'https://checkout.stripe.com/c/pay/cs_test_123')
})

test('without SANITY_WRITE_TOKEN the checkout is refused before Stripe', async () => {
  // setup.mjs seeds a dummy token so modules load; a deployment missing the
  // write token must fail here, not on the buyer's order page after payment.
  // Restore the token: node:test runs these tests in one process, and the ones
  // below need it.
  const savedToken = process.env.SANITY_WRITE_TOKEN
  delete process.env.SANITY_WRITE_TOKEN
  try {
    const res = await post('book-1')

    assert.equal(res.statusCode, 500)
    assert.deepEqual(res.body, {
      error: 'SANITY_WRITE_TOKEN is required to mint redemption codes after payment; checkout refuses to start without it.',
    })
    assert.equal(sessionParams, undefined) // never reached Stripe
  } finally {
    process.env.SANITY_WRITE_TOKEN = savedToken
  }
})

test('with SANITY_WRITE_TOKEN the same request still reaches Stripe', async () => {
  process.env.SANITY_WRITE_TOKEN = 'test-write-token'

  const res = await post('book-1')

  assert.equal(res.statusCode, 303)
  assert.equal(res.redirectUrl, 'https://checkout.stripe.com/c/pay/cs_test_123')
})

const phoneOnlyBuyer = { primaryEmailAddress: null }

// A phone-only account has no email to verify, so it gets the settings-page
// redirect like an unverified one instead of an unstructured 500.
test('a buyer with no email address is redirected to settings, not 500d', async () => {
  const res = await post('book-1', phoneOnlyBuyer)

  assert.equal(res.statusCode, 303)
  assert.equal(res.redirectUrl, '/account/settings?verify=email')
  assert.equal(sessionParams, undefined) // never reached Stripe
})

test('an unverified buyer is refused before Stripe is reached', async () => {
  const unverified = {
    primaryEmailAddress: { emailAddress: 'buyer@example.org', verification: { status: 'unverified' } },
  }
  const res = await post('book-1', unverified)

  assert.equal(res.statusCode, 303)
  assert.equal(res.redirectUrl, '/account/settings?verify=email')
  assert.equal(sessionParams, undefined) // never reached Stripe
})

test('an unknown book id gives a clean 404, no Stripe call', async () => {
  const res = await post('does-not-exist')

  assert.equal(res.statusCode, 404)
  assert.equal(sessionParams, undefined) // never reached Stripe
  assert.deepEqual(res.body, { error: 'not_found' })
})

test('an untitled book is not sellable: 404, no Stripe call', async () => {
  // title is optional in the book schema, and Stripe rejects an empty
  // product_data.name (same parameter_invalid_empty as a missing cover).
  fake.reset()
  fake.seed([seededPublisher, seededCoverAsset, { ...seededBook, title: undefined }])
  const res = await post('book-1')

  assert.equal(res.statusCode, 404)
  assert.equal(sessionParams, undefined) // never reached Stripe
  assert.deepEqual(res.body, { error: 'not_found' })
})

test('a book with no cover omits images from the Stripe session', async () => {
  // cover is optional in the book schema: GROQ dereferences a missing cover to
  // null, and Stripe rejects empty image entries (parameter_invalid_empty).
  fake.reset()
  fake.seed([seededPublisher, { ...seededBook, cover: undefined }])
  const res = await post('book-1')

  assert.equal(res.statusCode, 303)
  assert.equal(sessionParams.line_items[0].price_data.product_data.images, undefined)
})

test('non-POST is rejected with 405 and an Allow header', async () => {
  const res = makeRes()
  await handler({ method: 'GET', headers: {} }, res, { sanity: fake.client(), stripe: stripeCapture })

  assert.equal(res.statusCode, 405)
  assert.equal(res.headers['Allow'], 'POST')
  assert.equal(sessionParams, undefined) // no Stripe call attempted
})
