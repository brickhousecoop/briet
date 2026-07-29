import Head from '@components/head.jsx'
import Footer from '@components/footer'
import Link from 'next/link'
import { mintRedeemCode } from '@lib/redeemCode'
import { getStripeServerClient } from '../../utils/stripe-helpers'

import styles from '../../styles/Home.module.css'

const OrderPage = ({ order, redeemCode }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>{`BRIET Bookmarket: ${redeemCode ? 'Your Redemption Code' : 'Order Pending'}`}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <span className="logo">BRIET</span> {redeemCode ? 'Order Complete' : 'Order Pending'}
        </h1>

        {redeemCode ? (
          <>
            <p className={styles.description}>Your redemption code:</p>

            <p className={styles.redeemcode}>{redeemCode}</p>

            <p className={styles.instructions}>
              Enter this code in your <Link href="https://github.com/ArchiveLabs/lenny">Lenny</Link> library’s
              Import screen to pull this book into your collection. The code works once, so keep it until the import
              succeeds.
            </p>

            <p>A receipt is on its way to {order.email}.</p>
          </>
        ) : (
          <>
            <p>
              We have your order and are reviewing the payment. Once it clears, reload this page for your redemption
              code.
            </p>

            <p>Payment status: {order.payment_status}</p>
          </>
        )}

        <p>
          Questions, or need to make changes? Email <a href="mailto:help@briet.app">help@briet.app</a>.
        </p>
      </main>

      <Footer />
    </div>
  )
}

export const getServerSideProps = async ({ params }) => {
  const stripe = getStripeServerClient()
  const session = await stripe.checkout.sessions.retrieve(params.id)

  if (!session) {
    return { notFound: true }
  }

  // Sessions created before checkout started tagging the book carry no item id
  // and cannot be fulfilled automatically.
  const bookId = session.metadata?.briet_item_id
  const redeemCode =
    session.payment_status === 'paid' && bookId ? await mintRedeemCode(session.id, bookId) : null

  return {
    props: {
      order: {
        id: session.id,
        payment_status: session.payment_status,
        email: session.customer_details?.email ?? null,
      },
      redeemCode,
    },
  }
}

export default OrderPage
