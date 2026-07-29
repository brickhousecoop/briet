import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// Minting is what turns a paid checkout into something the buyer can redeem in
// Lenny. The gate matters as much as the mint: an unpaid or untagged session
// must not produce a working code. Sanity is the only boundary mocked.

let stored // documents in the fake dataset, keyed by _id

mock.module('@repo/sanity-client', {
  exports: {
    createSanityWriteClient: () => ({
      // Sanity keeps the first writer's document and returns it untouched,
      // which is what makes the deterministic _id an idempotency guarantee.
      createIfNotExists: async (doc) => (stored[doc._id] ??= doc),
    }),
  },
})

const { mintRedeemCode } = await import('../lib/redeemCode.ts')

const paidSession = {
  id: 'cs_test_123',
  payment_status: 'paid',
  metadata: { briet_item_id: 'book-1' },
}

beforeEach(() => {
  stored = {}
})

test('a paid session mints a code for the purchased book', async () => {
  const code = await mintRedeemCode(paidSession)

  assert.match(code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/)

  // one code per checkout session, enforced by the id rather than a lookup
  const created = stored['redeem-cs_test_123']
  assert.equal(created.code, code)
  assert.equal(created._type, 'redeemCode')
  assert.equal(created.stripeSessionId, 'cs_test_123')
  assert.deepEqual(created.books, [{ _type: 'reference', _ref: 'book-1', _key: 'book-1' }])
})

test('reloading the order page returns the first code, it does not mint a second', async () => {
  const first = await mintRedeemCode(paidSession)
  const second = await mintRedeemCode(paidSession)

  assert.equal(second, first)
  assert.deepEqual(Object.keys(stored), ['redeem-cs_test_123'])
})

test('an unpaid session mints nothing', async () => {
  const code = await mintRedeemCode({ ...paidSession, payment_status: 'unpaid' })

  assert.equal(code, null)
  assert.deepEqual(stored, {})
})

test('a session with no book id mints nothing', async () => {
  const code = await mintRedeemCode({ ...paidSession, metadata: {} })

  assert.equal(code, null)
  assert.deepEqual(stored, {})
})
