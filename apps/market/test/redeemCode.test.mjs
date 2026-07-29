import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// Minting is what turns a paid checkout into something the buyer can redeem in
// Lenny. The gate matters as much as the mint: an unpaid or untagged session
// must not produce a working code. Sanity is the only boundary mocked.

let created // the document handed to createIfNotExists

mock.module('@repo/sanity-client', {
  namedExports: {
    createSanityClient: () => ({
      createIfNotExists: async (doc) => {
        created = doc
        return doc
      },
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
  created = undefined
})

test('a paid session mints a code for the purchased book', async () => {
  const code = await mintRedeemCode(paidSession)

  assert.match(code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  assert.equal(created.code, code)
  assert.equal(created._type, 'redeemCode')
  assert.deepEqual(created.books, [{ _type: 'reference', _ref: 'book-1', _key: 'book-1' }])

  // one code per checkout session, enforced by the id rather than a lookup
  assert.equal(created._id, 'redeem-cs_test_123')
  assert.equal(created.stripeSessionId, 'cs_test_123')
})

test('an unpaid session mints nothing', async () => {
  const code = await mintRedeemCode({ ...paidSession, payment_status: 'unpaid' })

  assert.equal(code, null)
  assert.equal(created, undefined)
})

test('a session with no book id mints nothing', async () => {
  const code = await mintRedeemCode({ ...paidSession, metadata: {} })

  assert.equal(code, null)
  assert.equal(created, undefined)
})
