import { test, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import Stripe from 'stripe'
import { startFakeSanity } from './helpers/fakeSanity.mjs'
import { makeRes } from './helpers/fakeRes.mjs'

// Both download routes decide who may have a book and then redirect to Sanity's
// CDN. Sanity runs against a fake Content Lake via the real client; Stripe is an
// injected stand-in answering the one session lookup the paid route makes.

const fake = await startFakeSanity()
after(() => fake.close())

const { default: orderHandler } = await import('../pages/api/download/order/[sessionId].ts')
const { default: freeHandler } = await import('../pages/api/download/free/[bookId].ts')

const FILE_URL = 'https://cdn.sanity.io/files/p/production/abc123.epub'
const seededAsset = { _id: 'file-abc123-epub', _type: 'sanity.fileAsset', url: FILE_URL, extension: 'epub' }
const seededBook = {
  _id: 'book-1',
  _type: 'book',
  title: 'The Test Book',
  slug: { _type: 'slug', current: 'the-test-book' },
  price_usd: 25,
  file: { _type: 'file', asset: { _type: 'reference', _ref: 'file-abc123-epub' } },
}
const freeBook = { ...seededBook, _id: 'book-free', price_usd: 0 }
const filelessBook = { _id: 'book-nofile', _type: 'book', slug: { current: 'no-file' }, price_usd: 0 }

const stripeWith = (session) => ({
  checkout: {
    sessions: {
      retrieve: async (id) => {
        if (id === 'cs_unreachable') {
          throw new Stripe.errors.StripeConnectionError({ message: 'Network error' })
        }
        if (id !== 'cs_test_123') {
          throw new Stripe.errors.StripeInvalidRequestError({
            message: `No such checkout.session: '${id}'`,
            code: 'resource_missing',
            statusCode: 404,
          })
        }
        return { id, ...session }
      },
    },
  },
})

const paidSession = { payment_status: 'paid', metadata: { briet_item_id: 'book-1' } }

const getOrder = async (sessionId, session = paidSession) => {
  const res = makeRes()
  await orderHandler({ method: 'GET', query: { sessionId } }, res, {
    sanity: fake.client(),
    stripe: stripeWith(session),
  })
  return res
}

const getFree = async (bookId) => {
  const res = makeRes()
  await freeHandler({ method: 'GET', query: { bookId } }, res, { sanity: fake.client() })
  return res
}

beforeEach(() => {
  fake.reset()
  fake.seed([seededAsset, seededBook, freeBook, filelessBook])
})

test('a paid order redirects to the book file, named for download', async () => {
  const res = await getOrder('cs_test_123')

  assert.equal(res.statusCode, 302)
  assert.equal(res.redirectUrl, `${FILE_URL}?dl=the-test-book.epub`)
  assert.equal(res.headers['Cache-Control'], 'private, no-store')
})

test('an unpaid session gets nothing', async () => {
  const res = await getOrder('cs_test_123', { payment_status: 'unpaid', metadata: { briet_item_id: 'book-1' } })

  assert.equal(res.statusCode, 404)
  assert.equal(res.redirectUrl, undefined)
})

test('a session from another flow, with no book in its metadata, gets nothing', async () => {
  const res = await getOrder('cs_test_123', { payment_status: 'paid', metadata: {} })

  assert.equal(res.statusCode, 404)
})

test('an unknown session id is a 404, not a crash', async () => {
  const res = await getOrder('cs_bogus')

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { error: 'not_found' })
})

test('a Stripe outage surfaces as a failure, not as a missing order', async () => {
  await assert.rejects(getOrder('cs_unreachable'), Stripe.errors.StripeConnectionError)
})

test('a paid order for a book with no file is a 404 rather than a broken redirect', async () => {
  const res = await getOrder('cs_test_123', { payment_status: 'paid', metadata: { briet_item_id: 'book-nofile' } })

  assert.equal(res.statusCode, 404)
  assert.equal(res.redirectUrl, undefined)
})

test('a free book downloads without any order', async () => {
  const res = await getFree('book-free')

  assert.equal(res.statusCode, 302)
  assert.equal(res.redirectUrl, `${FILE_URL}?dl=the-test-book.epub`)
})

test('the free route refuses a priced book', async () => {
  const res = await getFree('book-1')

  assert.equal(res.statusCode, 404)
  assert.equal(res.redirectUrl, undefined)
})

test('a free book with no file is a 404 rather than a broken redirect', async () => {
  const res = await getFree('book-nofile')

  assert.equal(res.statusCode, 404)
})
