import Link from 'next/link'
import Stripe from 'stripe'
import { auth, currentUser } from '@clerk/nextjs/server'
import {
  stripe,
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
    "coverImageUrl": cover.asset->url,
    authors[]->{ name },
  }
`

type BookMeta = {
  _id: string
  title: string
  coverImageUrl: string | null
  authors: { name: string }[] | null
}

type LibraryEntry = {
  book: BookMeta
  quantity: number
  firstApprovedAt: number | null
}

async function quantityOfSession(session: Stripe.Checkout.Session): Promise<number> {
  const items: Stripe.LineItem[] =
    session.line_items?.data ??
    (await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 })).data
  return items.reduce((acc, li) => acc + (li.quantity ?? 0), 0)
}

export default async function LibraryPage() {
  const { userId, orgId } = await auth()
  if (!userId) {
    return (
      <div>
        <h1>Library</h1>
        <p>You must be <Link href="/account/sign-in">signed in</Link> to view this page.</p>
      </div>
    )
  }

  const sessions: Stripe.Checkout.Session[] = []
  if (orgId) sessions.push(...(await getOrdersForOrg(orgId)))
  sessions.push(...(await getOrdersForUser(userId)))

  const user = await currentUser()
  const email = user
    ? user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
    : undefined
  if (email) sessions.push(...(await getOrdersForEmail(email)))

  const seen = new Set<string>()
  const approved = sessions.filter(s => {
    if (seen.has(s.id)) return false
    seen.add(s.id)
    return isOrderApproved(s)
  })

  // Group by book id, summing quantities.
  const byBook = new Map<string, { quantity: number; firstApprovedAt: number | null }>()
  for (const session of approved) {
    const bookId = session.metadata?.briet_book_id
    if (!bookId) continue
    const qty = await quantityOfSession(session)
    const existing = byBook.get(bookId)
    const created = session.created ?? null
    byBook.set(bookId, {
      quantity: (existing?.quantity ?? 0) + qty,
      firstApprovedAt:
        existing?.firstApprovedAt != null && created != null
          ? Math.min(existing.firstApprovedAt, created)
          : existing?.firstApprovedAt ?? created,
    })
  }

  const bookIds = Array.from(byBook.keys())
  const books: BookMeta[] = bookIds.length
    ? await sanity.fetch(booksByIdsQuery, { ids: bookIds })
    : []
  const bookById = new Map(books.map(b => [b._id, b]))

  const entries: LibraryEntry[] = bookIds
    .map(id => {
      const book = bookById.get(id)
      const agg = byBook.get(id)!
      if (!book) return null
      return { book, quantity: agg.quantity, firstApprovedAt: agg.firstApprovedAt }
    })
    .filter((e): e is LibraryEntry => e !== null)
    .sort((a, b) => (b.firstApprovedAt ?? 0) - (a.firstApprovedAt ?? 0))

  return (
    <div>
      <h1>Library</h1>
      {!orgId && (
        <p><em>Select an organization in the header to see its full library.</em></p>
      )}
      {entries.length === 0 ? (
        <p>You don&apos;t have any approved purchases yet. See <Link href="/account/orders">your orders</Link> for pending items.</p>
      ) : (
        <ul>
          {entries.map(({ book, quantity, firstApprovedAt }) => (
            <li key={book._id}>
              {book.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={book.coverImageUrl} alt={`Cover of ${book.title}`} style={{ maxWidth: 120 }} />
              )}
              <h2>{book.title}</h2>
              {book.authors && book.authors.length > 0 && (
                <p>{book.authors.map(a => a.name).join(', ')}</p>
              )}
              <p>Copies owned: {quantity}</p>
              {firstApprovedAt != null && (
                <p>First acquired: {new Date(firstApprovedAt * 1000).toLocaleDateString()}</p>
              )}
              <p><Link href={`/download/${book._id}`}>Download &darr;</Link></p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
