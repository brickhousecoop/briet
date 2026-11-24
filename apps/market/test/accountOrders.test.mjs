import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sessionBelongsToUser } from '../lib/accountOrders.ts'

const session = { customer_details: { email: 'buyer@example.org' } }
const userWith = (emailAddress, status = 'verified') => ({
  emailAddresses: [{ emailAddress, verification: { status } }],
})

test('matching verified email owns the order', () => {
  assert.equal(sessionBelongsToUser(session, userWith('buyer@example.org')), true)
})

test('email ownership ignores capitalization', () => {
  assert.equal(sessionBelongsToUser(session, userWith('Buyer@Example.ORG')), true)
})

test('an unverified email does not own the order', () => {
  assert.equal(sessionBelongsToUser(session, userWith('buyer@example.org', 'unverified')), false)
})

test('a different email does not own the order', () => {
  assert.equal(sessionBelongsToUser(session, userWith('other@example.org')), false)
})
