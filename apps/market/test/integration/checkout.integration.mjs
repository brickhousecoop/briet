import { test, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { startFakeSanity } from '../helpers/fakeSanity.mjs'
import { makeRes } from '../helpers/fakeRes.mjs'

// The real Stripe test API decides whether our Checkout Session payload is
// acceptable. That rejection is the one thing a stand-in structurally cannot
// produce: it answers however it was taught to. Sanity is a fake here -- its
// real Content Lake is exercised by redeem.integration.mjs -- so only Stripe is
// real, and the test is about the request we send it.
//
// Not part of `npm test`: needs a Stripe test key and network.

const key = process.env.STRIPE_SECRET_KEY
assert.ok(key, 'STRIPE_SECRET_KEY is required to run this test')
assert.match(key, /^sk_test_/, 'refusing to run against a live Stripe key')
assert.notEqual(process.env.NODE_ENV, 'production', 'refusing to run in production')

const fake = await startFakeSanity()
after(() => fake.close())

const { default: handler } = await import('../../pages/api/checkout.ts')
const { getStripeServerClient } = await import('../../utils/stripe-helpers.ts')

const seededPublisher = { _id: 'publisher-1', _type: 'publisher', name: 'Test Press' }
const seededCoverAsset = {
  _id: 'image-abc123-600x900-jpg',
  _type: 'sanity.imageAsset',
  url: 'https://cdn.sanity.io/images/p/production/abc123-600x900.jpg',
}
const seededBook = {
  _id: 'book-integration',
  _type: 'book',
  title: 'Integration Test Book',
  price_usd: 25,
  publisher: { _type: 'reference', _ref: 'publisher-1' },
  cover: { _type: 'image', asset: { _type: 'reference', _ref: 'image-abc123-600x900-jpg' } },
}

const stripe = getStripeServerClient()
const created = []

beforeEach(() => {
  fake.reset()
  fake.seed([seededPublisher, seededCoverAsset, seededBook])
})

// Sessions accumulate in the Stripe test account otherwise. Expire is best
// effort: it stops the session being payable, it does not remove it. Expiration
// failures are reported rather than swallowed -- a leaked test-mode session can
// charge nothing, but a cleanup that silently succeeds hides that it did not run.
after(async () => {
  const failures = []
  await Promise.all(created.map(async (id) => {
    try {
      await stripe.checkout.sessions.expire(id)
    } catch (err) {
      failures.push(`${id}: ${err.message}`)
    }
  }))
  assert.deepEqual(failures, [], 'some Stripe test sessions could not be expired')
})

test('Stripe accepts the checkout payload and echoes our metadata back', async () => {
  const res = makeRes()
  await handler(
    {
      method: 'POST',
      body: { briet_item_id: 'book-integration' },
      headers: { origin: 'https://market.briet.app' },
    },
    res,
    {
      sanity: fake.client(),
      stripe,
      getUser: async () => ({
        primaryEmailAddress: {
          emailAddress: 'integration@example.org',
          verification: { status: 'verified' },
        },
      }),
    }
  )

  // Track the session before asserting on anything else, so a failed assertion
  // cannot leave a created session behind unnoticed. With a custom payment
  // domain (pay.briet.app) the session id rides in the URL path.
  const match = /\/c\/pay\/(cs_[a-zA-Z0-9_]+)/.exec(res.redirectUrl ?? '')
  if (match) created.push(match[1])

  assert.equal(res.statusCode, 303)
  assert.ok(match, `expected a Stripe hosted URL carrying a session id, got ${res.redirectUrl}`)

  // Round-trip through Stripe's own API, not through what the handler claimed
  // to send. This is where custom_text / consent_collection / line_items were
  // validated on the way in.
  const session = await stripe.checkout.sessions.retrieve(match[1], {
    // price_data is materialised into a real Price on create, and its product
    // is a real Product, so both need expanding to assert on their fields.
    expand: ['line_items.data.price.product'],
  })

  assert.equal(session.livemode, false)
  assert.equal(session.mode, 'payment')
  assert.equal(session.payment_status, 'unpaid')
  assert.equal(session.metadata.briet_item_id, 'book-integration')
  assert.match(session.metadata.briet_redeem_code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/)

  // customer_email is the field we set; customer_details is what Stripe fills
  // in after payment.
  assert.equal(session.customer_email, 'integration@example.org')

  assert.equal(session.line_items.data.length, 1)
  const item = session.line_items.data[0]
  assert.equal(item.quantity, 1)
  assert.equal(item.price.unit_amount, 2500)
  assert.equal(item.price.currency, 'usd')
  assert.equal(item.price.product.name, 'Integration Test Book')

  // These are the long hand-written blocks in checkout.ts. Stripe validates
  // them on the way in, but only reading them back proves they survived.
  assert.equal(session.consent_collection.terms_of_service, 'required')
  assert.ok(session.custom_text.submit.message)
  assert.ok(session.custom_text.terms_of_service_acceptance.message)

  assert.equal(session.success_url, `${process.env.SITE_URL}/order/{CHECKOUT_SESSION_ID}`)
  assert.equal(session.cancel_url, `${process.env.SITE_URL}/buy/book-integration`)
})