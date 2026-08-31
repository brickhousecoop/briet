import sanity from '@repo/sanity-client'

import Head from '@components/head.jsx'
import Footer from '@components/footer'
import CopyButton from '@components/CopyButton'
import Link from 'next/link'
import { mintRedeemCode } from '../../lib/redeemCode'
import { getStripeServerClient } from '../../utils/stripe-helpers'

import styles from '../../styles/Home.module.css'

const hasFileQuery = `defined(*[_type == "book" && _id == $id][0].file.asset->url)`

const OrderPage = ({ order, redeemCode, hasDownload }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>{`BRIET Bookmarket: ${redeemCode ? 'Your Redemption Code' : 'Order Pending'}`}</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <Link href="/"><span className="logo">BRIET</span></Link> {redeemCode ? 'Order Complete' : 'Order Pending'}
        </h1>

        {redeemCode ? (
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

export const getServerSideProps = async ({ params }) => {
  const stripe = getStripeServerClient()
  const session = await stripe.checkout.sessions.retrieve(params.id)
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
