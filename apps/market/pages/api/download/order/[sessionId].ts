import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import sanity, { createSanityClient } from '@repo/sanity-client'
import { sessionBelongsToUser } from '../../../../lib/accountOrders'
import { getPagesUser } from '../../../../lib/pagesUser'
import { redirectToBookFile } from '../../../../lib/bookDownload'
import { getStripeServerClient } from '../../../../utils/stripe-helpers'

type Deps = {
  sanity?: ReturnType<typeof createSanityClient>
  stripe?: InstanceType<typeof Stripe>
  getUser?: typeof getPagesUser
}

// Paid downloads require the checkout email to be verified on the buyer's account.
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

  const user = await (deps.getUser ?? getPagesUser)(req)
  if (!user || !sessionBelongsToUser(session, user)) {
    return res.redirect(302, `/order/${sessionId}`)
  }

  if (!await redirectToBookFile(res, deps.sanity ?? sanity, bookId)) {
    // A paid order with nothing to deliver is a cataloguing fault, not a bad request.
    console.error(`download: paid session ${session.id} has no file for book ${bookId}`)
    return res.status(404).json({ error: 'not_found' })
  }
}
