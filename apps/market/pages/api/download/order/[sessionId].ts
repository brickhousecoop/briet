import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import sanity, { createSanityClient } from '@repo/sanity-client'
import { redirectToBookFile } from '../../../../lib/bookDownload'
import { getStripeServerClient } from '../../../../utils/stripe-helpers'

type Deps = { sanity?: ReturnType<typeof createSanityClient>; stripe?: InstanceType<typeof Stripe> }

// The buyer's download for a paid order. The Stripe Checkout Session id is the
// only credential: whoever has the order URL can re-download indefinitely.
export default async function handler(req: NextApiRequest, res: NextApiResponse, deps: Deps = {}) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end('Method Not Allowed')
  }

  const sessionId = req.query.sessionId as string

  let session: Stripe.Checkout.Session
  try {
    session = await (deps.stripe ?? getStripeServerClient()).checkout.sessions.retrieve(sessionId)
  } catch (err) {
    // Stripe throws rather than returning null for an id that belongs to no
    // session — a mistyped or truncated URL, not a server fault. Every other
    // invalid request is us sending Stripe something wrong, and stays a 500.
    if (err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'resource_missing') {
      return res.status(404).json({ error: 'not_found' })
    }
    throw err
  }

  const bookId = session.metadata?.briet_item_id
  if (session.payment_status !== 'paid' || !bookId) {
    return res.status(404).json({ error: 'not_found' })
  }

  if (!await redirectToBookFile(res, deps.sanity ?? sanity, bookId)) {
    // A paid order with nothing to deliver is a cataloguing fault, not a bad request.
    console.error(`download: paid session ${session.id} has no file for book ${bookId}`)
    return res.status(404).json({ error: 'not_found' })
  }
}
