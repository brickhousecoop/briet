import sanity from '@repo/sanity-client'

import Head from '@components/head.jsx'
import Footer from '@components/footer'
import CopyButton from '@components/CopyButton'
import Link from 'next/link'
import Stripe from 'stripe'
import { sessionBelongsToUser } from '../../lib/accountOrders'
import { getPagesUser } from '../../lib/pagesUser'
import { mintRedeemCode } from '../../lib/redeemCode'
import { getStripeServerClient } from '../../utils/stripe-helpers'

import styles from '../../styles/Home.module.css'

const hasFileQuery = `defined(*[_type == "book" && _id == $id][0].file.asset->url)`

const OrderPage = ({ order, redeemCode, hasDownload, forbidden }) => {
  const heading = forbidden ? 'Order Unavailable' : redeemCode ? 'Order Complete' : 'Order Pending'

  return (
    <div className={styles.container}>
      <Head>
        <title>{`BRIET Bookmarket: ${redeemCode ? 'Your Redemption Code' : heading}`}</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <Link href="/"><span className="logo">BRIET</span></Link> {heading}
        </h1>

        {forbidden ? (
          <p className={styles.description}>
            This order was placed with an email  address that isn&apos;t linked to your account. Please make sure you verified your email, or contact <a href="mailto:help@briet.app">help@briet.app</a>.
          </p>
        ) : redeemCode ? (
          <>
            {hasDownload && (
              <a className={styles.downloadbutton} href={`/api/download/order/${order.id}`}>
                Download your book
              </a>
            )}

            <section className={styles.redeemsection}>
              <p className={styles.redeemlabel}>
                {hasDownload ? 'Or import it into your library with this redemption code:' : 'Your redemption code:'}
              </p>

              <div className={styles.redeemcodeRow}>
                <code className={styles.redeemcode}>{redeemCode}</code>
                <CopyButton text={redeemCode} label="Copy code" className={styles.copyInBox} />
              </div>

              <p className={styles.redeemnote}>
                Enter this code in your <Link href="https://github.com/ArchiveLabs/lenny">Lenny</Link> library’s
                Import screen to pull this book into your collection. The code works once, so keep it until the import
                succeeds.
              </p>
            </section>

            {order.email && <p className={styles.ordernote}>A receipt is on its way to {order.email}.</p>}
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

        <p className={styles.ordernote}>
          Questions, or need to make changes? Email <a href="mailto:help@briet.app">help@briet.app</a>.
        </p>
      </main>

      <Footer />
    </div>
  )
}

export const getServerSideProps = async ({ params, req, res }) => {
  const user = await getPagesUser(req)
  if (!user) {
    return {
      redirect: {
        destination: `/account/sign-in?redirect_url=${encodeURIComponent(`/order/${params.id}`)}`,
        permanent: false,
      },
    }
  }

  const stripe = getStripeServerClient()
  let session
  try {
    session = await stripe.checkout.sessions.retrieve(params.id)
  } catch (err) {
    // A mistyped or cross-environment session id is a bad URL, not a server
    // fault. Everything else (e.g. an auth failure from a bad key) stays loud.
    if (err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'resource_missing') {
      return { notFound: true }
    }
    throw err
  }
  if (!sessionBelongsToUser(session, user)) {
    res.statusCode = 403
    return { props: { forbidden: true } }
  }

  const redeemCode = await mintRedeemCode(session)

  // Without a file there is nothing for the download route to serve, and offering
  // the button anyway would land a paying buyer on a bare 404.
  const hasDownload = redeemCode !== null && await sanity.fetch(hasFileQuery, { id: session.metadata.briet_item_id })

  return {
    props: {
      order: {
        id: session.id,
        payment_status: session.payment_status,
        email: session.customer_details?.email ?? null,
      },
      redeemCode,
      hasDownload,
    },
  }
}

export default OrderPage
