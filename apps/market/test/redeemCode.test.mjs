import { test, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { startFakeSanity } from './helpers/fakeSanity.mjs'

// Minting turns a paid checkout into a code the buyer can redeem in Lenny. The
// gate matters as much as the mint: an unpaid or untagged session must not
// produce a working code. Runs against a fake Content Lake via the real client,
// so the createIfNotExists idempotency guarantee is exercised for real.

const fake = await startFakeSanity()
after(() => fake.close())
beforeEach(() => fake.reset())

const { mintRedeemCode } = await import('../lib/redeemCode.ts')

const paidSession = {
  id: 'cs_test_123',
  payment_status: 'paid',
  metadata: { briet_item_id: 'book-1' },
}

test('a paid session mints a code for the purchased book', async () => {
  const code = await mintRedeemCode(paidSession, fake.client())

  assert.match(code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/)

  // one code per checkout session, enforced by the deterministic _id, not a lookup
  const created = fake.doc('redeem-cs_test_123')
  assert.equal(created.code, code)
  assert.equal(created._type, 'redeemCode')
  assert.equal(created.stripeSessionId, 'cs_test_123')
  assert.deepEqual(created.books, [{ _type: 'reference', _ref: 'book-1', _key: 'book-1' }])
})

test('reloading the order page returns the first code, it does not mint a second', async () => {
  const first = await mintRedeemCode(paidSession, fake.client())
  const second = await mintRedeemCode(paidSession, fake.client())

  assert.equal(second, first)
  assert.equal(fake.doc('redeem-cs_test_123').code, first) // first code survives; both creates attempted, one stored
})

test('an unpaid session mints nothing', async () => {
  const code = await mintRedeemCode({ ...paidSession, payment_status: 'unpaid' }, fake.client())

  assert.equal(code, null)
  assert.equal(fake.doc('redeem-cs_test_123'), undefined)
})

test('a session with no book id mints nothing', async () => {
  const code = await mintRedeemCode({ ...paidSession, metadata: {} }, fake.client())

  assert.equal(code, null)
  assert.equal(fake.calls.mutations.length, 0)
})
