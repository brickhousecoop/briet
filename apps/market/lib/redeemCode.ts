import { randomBytes } from 'node:crypto'
import type Stripe from 'stripe'
import { createSanityWriteClient } from '@repo/sanity-client'

// No 0/O/1/I so codes survive being read aloud over a phone.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode(): string {
  const chars = Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length])
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`
}

// Fulfilment for a completed checkout: one redemption code per session, minted
// on demand when the order page is loaded rather than by a webhook.
//
// The deterministic _id makes the create atomic, so concurrent loads of the
// order page cannot mint two codes for one purchase; a repeat call returns the
// code minted first. Returns null when there is nothing to fulfil — the payment
// has not cleared, or the session predates checkout tagging the book.
export async function mintRedeemCode(session: Stripe.Checkout.Session): Promise<string | null> {
  const bookId = session.metadata?.briet_item_id
  if (session.payment_status !== 'paid' || !bookId) {
    return null
  }

  // Built here rather than at module scope: `next build` evaluates this module
  // while collecting page data, so demanding the token up there fails the build
  // on any deployment that only serves the catalog.
  const doc = await createSanityWriteClient().createIfNotExists({
    _id: `redeem-${session.id}`,
    _type: 'redeemCode',
    code: randomCode(),
    books: [{ _type: 'reference', _ref: bookId, _key: bookId }],
    stripeSessionId: session.id,
  })
  return doc.code as string
}
