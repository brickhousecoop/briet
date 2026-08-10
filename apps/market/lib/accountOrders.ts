import type Stripe from 'stripe'
import type { createSanityClient } from '@repo/sanity-client'

export type Order = {
  sessionId: string
  bookTitle: string | null
  hasDownload: boolean
  created: number
  amountTotal: number | null
  redeemCode: string | null
  redeemedAt: string | null
}

const orderDetailQuery = `{
  "codes": *[_type == "redeemCode" && stripeSessionId in $sessionIds] {
    stripeSessionId,
    code,
    redeemedAt,
  },
  "books": *[_type == "book" && _id in $bookIds] {
    _id,
    title,
    "hasFile": defined(file.asset->url),
  },
}`

// Stripe's customer_details[email] filter is case-sensitive, and Checkout stores
// the address exactly as the buyer typed it — so a buyer who capitalised anything
// is invisible to a filtered query. Scanning and comparing ourselves is the only
// way to match an address the way people expect.
//
// It walks every session in the account, which bounds how far this scales: the way
// out is an order index keyed on a normalised email, which the checkout.session.completed
// webhook that lib/redeemCode.ts wants would be the natural place to maintain.
async function paidSessionsFor(stripe: InstanceType<typeof Stripe>, emails: string[]) {
  const wanted = new Set(emails.map((email) => email.toLowerCase()))
  const sessions: Stripe.Checkout.Session[] = []
  for await (const session of stripe.checkout.sessions.list({ limit: 100 })) {
    const email = session.customer_details?.email?.toLowerCase()
    if (session.payment_status === 'paid' && email && wanted.has(email)) {
      sessions.push(session)
    }
  }
  return sessions
}

export async function listOrdersForEmails(
  stripe: InstanceType<typeof Stripe>,
  sanity: ReturnType<typeof createSanityClient>,
  emails: string[]
): Promise<Order[]> {
  const sessions = await paidSessionsFor(stripe, emails)
  if (sessions.length === 0) {
    return []
  }

  const sessionIds = sessions.map((session) => session.id)
  const bookIds = Array.from(new Set(sessions.map((session) => session.metadata?.briet_item_id).filter(Boolean)))
  const detail: {
    codes: { stripeSessionId: string; code: string; redeemedAt: string | null }[]
    books: { _id: string; title: string; hasFile: boolean }[]
  } = await sanity.fetch(orderDetailQuery, { sessionIds, bookIds })

  const codeBySession = new Map(detail.codes.map((c) => [c.stripeSessionId, c]))
  const bookById = new Map(detail.books.map((b) => [b._id, b]))

  return sessions
    .sort((a, b) => b.created - a.created)
    .map((session) => {
      // Absent until the buyer opens the order page, which is what mints the code.
      const minted = codeBySession.get(session.id)
      const book = bookById.get(session.metadata?.briet_item_id ?? '')
      return {
        sessionId: session.id,
        bookTitle: book?.title ?? null,
        hasDownload: book?.hasFile ?? false,
        created: session.created,
        amountTotal: session.amount_total,
        redeemCode: minted?.code ?? null,
        redeemedAt: minted?.redeemedAt ?? null,
      }
    })
}
