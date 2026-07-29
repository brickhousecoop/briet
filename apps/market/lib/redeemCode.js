import { randomBytes } from 'node:crypto'
import { createSanityClient } from '@repo/sanity-client'

// No 0/O/1/I so codes survive being read aloud over a phone.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const write = createSanityClient({ useCdn: false })

function randomCode() {
  const chars = Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length])
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`
}

// One code per checkout session. The deterministic _id makes this atomic, so
// concurrent loads of the order page cannot mint two codes for one purchase.
// Returns the stored code, which on a repeat call is the one minted first.
export async function mintRedeemCode(sessionId, bookId) {
  const doc = await write.createIfNotExists({
    _id: `redeem-${sessionId}`,
    _type: 'redeemCode',
    code: randomCode(),
    books: [{ _type: 'reference', _ref: bookId, _key: bookId }],
    stripeSessionId: sessionId,
  })
  return doc.code
}
