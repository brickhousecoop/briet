import Link from 'next/link'
import Stripe from 'stripe'
import { auth, currentUser } from '@clerk/nextjs/server'
import {
  getOrdersForOrg,
  getOrdersForUser,
  getOrdersForEmail,
  isOrderApproved,
} from '@lib/stripe'
import { readOnlyClient as sanity } from '@repo/sanity-client'

export const dynamic = 'force-dynamic'

const booksByIdsQuery = `
  *[_type == "book" && _id in $ids] {
    _id,
    title,
  }
`

type BookMeta = { _id: string; title: string }

function fmtDate(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleDateString()
}

function fmtAmount(session: Stripe.Checkout.Session): string {
  if (session.amount_total == null || !session.currency) return '—'
  return `${(session.amount_total / 100).toFixed(2)} ${session.currency.toUpperCase()}`
}

export default async function OrderHistoryPage() {
  const { userId, orgId } = await auth()
  if (!userId) {
    return (
      <div>
        <h1>Order History</h1>
        <p>You must be <Link href="/account/sign-in">signed in</Link> to view this page.</p>
      </div>
    )
  }

  const sessions: Stripe.Checkout.Session[] = []
  if (orgId) sessions.push(...(await getOrdersForOrg(orgId)))
  sessions.push(...(await getOrdersForUser(userId)))

  // Legacy fallback: match by primary email for orders placed before Clerk
  // metadata was being stamped onto the checkout session.
  const user = await currentUser()
  const email = user
    ? user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
    : undefined
  if (email) {
    const legacy = await getOrdersForEmail(email)
    sessions.push(...legacy)
  }

  // De-duplicate by session id.
  const seen = new Set<string>()
  const orders = sessions
    .filter(s => !seen.has(s.id) && seen.add(s.id))
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))

  const bookIds = Array.from(
    new Set(orders.map(o => o.metadata?.briet_book_id).filter((id): id is string => Boolean(id)))
  )
  const books: BookMeta[] = bookIds.length
    ? await sanity.fetch(booksByIdsQuery, { ids: bookIds })
    : []
  const titleById = new Map(books.map(b => [b._id, b.title]))

  return (
    <div>
      <h1>Order History</h1>
      {!orgId && (
        <p><em>Tip: select an organization in the header to see orders made on behalf of your library.</em></p>
      )}
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul>
          {orders.map(order => {
            const bookId = order.metadata?.briet_book_id
            const bookTitle = bookId ? titleById.get(bookId) : undefined
            const approved = isOrderApproved(order)
            return (
              <li key={order.id}>
                <p>
                  <Link href={`/order/${order.id}`}>
                    {bookTitle ?? `Order ${order.id}`}
                  </Link>
                </p>
                <p>Amount: {fmtAmount(order)}</p>
                <p>Date: {order.created ? fmtDate(order.created) : '—'}</p>
                <p>Payment: {order.payment_status} · Status: {approved ? 'approved' : 'pending review'}</p>
                {approved && bookId && (
                  <p><Link href={`/download/${bookId}`}>Download &darr;</Link></p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
