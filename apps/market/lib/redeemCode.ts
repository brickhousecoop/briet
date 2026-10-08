import { randomBytes } from 'node:crypto'
import type Stripe from 'stripe'
import { createSanityWriteClient } from '@repo/sanity-client'

// No 0/O/1/I so codes survive being read aloud over a phone.
// Duplicated in apps/tagger/scripts/create-redeem-code.mjs (a standalone script
// in another app); keep the two alphabets and the XXXX-XXXX shape in sync.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRedeemCode(): string {
  const chars = Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length])
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`
}

// Fulfilment for a completed checkout: persist the redemption code chosen when
// its Stripe Checkout Session was created.
//
// TODO: Fulfil from a checkout.session.completed webhook instead of relying on
// the buyer to load the order page after payment.
//
// The deterministic _id makes the create atomic, so concurrent loads of the
// order page cannot mint two codes for one purchase; a repeat call returns the
// code minted first. Returns null when there is nothing to fulfil — the payment
// has not cleared, or the session lacks the required metadata.
//
// The write client is injectable so tests can point a real client at a fake
// Content Lake. Production callers omit it and it is built lazily (`next build`
// evaluates this module while collecting page data), so deploys that only serve
// the catalog — no SANITY_WRITE_TOKEN — still build. Keep it optional: a required
// param would force the token onto pages/order/[id].js.
export async function mintRedeemCode(
  session: Stripe.Checkout.Session,
  writeClient?: ReturnType<typeof createSanityWriteClient>
): Promise<string | null> {
  const bookId = session.metadata?.briet_item_id
  const code = session.metadata?.briet_redeem_code
  if (session.payment_status !== 'paid' || !bookId || !code) {
    return null
  }

  const write = writeClient ?? createSanityWriteClient()
  const doc = await write.createIfNotExists({
    _id: `redeem-${session.id}`,
    _type: 'redeemCode',
    code,
    books: [{ _type: 'reference', _ref: bookId, _key: bookId }],
    stripeSessionId: session.id,
  })
  return doc.code as string
}
