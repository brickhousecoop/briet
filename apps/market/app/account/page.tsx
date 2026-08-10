import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import sanity from '@repo/sanity-client'

import CopyButton from '@components/CopyButton'

import { listOrdersForEmails, type Order } from '../../lib/accountOrders'
import { getStripeServerClient } from '../../utils/stripe-helpers'
import styles from '@styles/Home.module.css'

export const metadata = { title: 'BRIET Bookmarket: Your Orders' }

const formatDate = (created: number) =>
  new Date(created * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const formatAmount = (amountTotal: number | null) =>
  amountTotal === null ? '' : `$${(amountTotal / 100).toFixed(2)}`

const OrderListing = ({ order }: { order: Order }) => (
  <div className={styles.orderlisting}>
    <h2>{order.bookTitle ?? 'This book is no longer in the catalog'}</h2>
    <p>{formatDate(order.created)} · {formatAmount(order.amountTotal)}</p>

    {order.hasDownload && (
      <a className={styles.downloadbutton} href={`/api/download/order/${order.sessionId}`}>
        Download
      </a>
    )}

    {order.redeemCode ? (
      <p>
        Lenny redemption code: <code className={styles.code}>{order.redeemCode}</code>{' '}
        <CopyButton text={order.redeemCode} label="Copy code" />
        {order.redeemedAt && ' — already redeemed'}
      </p>
    ) : (
      <p>
        <Link href={`/order/${order.sessionId}`}>Get your Lenny redemption code</Link>
      </p>
    )}
  </div>
)

export default async function OrderHistoryPage() {
  const user = await currentUser()
  if (!user) return <p>You must be signed in to view this page.</p>

  // Orders are keyed by the address given at Stripe checkout, which need not be
  // the one this account signed up with. Matching every verified address lets a
  // buyer see an old order by adding and verifying the email they used then.
  // Unverified addresses are excluded: anyone can claim one they do not own.
  const emails = user.emailAddresses
    .filter((address) => address.verification?.status === 'verified')
    .map((address) => address.emailAddress)

  const orders = await listOrdersForEmails(getStripeServerClient(), sanity, emails)

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          <span className="logo">BRIET</span> Your Orders
        </h1>

        {orders.length > 0 ? (
          orders.map((order) => <OrderListing key={order.sessionId} order={order} />)
        ) : (
          <p>No orders yet.</p>
        )}

        <p className={styles.instructions}>
          Missing an order? It is listed under whichever email you gave at checkout. Add that
          address to your account, or email <a href="mailto:help@briet.app">help@briet.app</a> and
          we will find it.
        </p>
      </main>
    </div>
  )
}
