import Stripe from 'stripe'

import Head from 'next/head'
import Image from '../../lib/sanityImage'
import Footer from '../../components/footer'

import styles from '../../styles/Home.module.css'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
})

const OrderPage = ({ order }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>{`BRIET Marketplace: Order Placed`}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          BRIET Order {order.id}
        </h1>

        <p>Status: {order.status}</p>
        <p>Payment Status: {order.payment_status}</p>

        <p className={styles.description}>
          Powered by <a href="https://controlleddigitallending.org">
            <strong>Controlled Digital Lending</strong>
          </a>
        </p>
      </main>

      <Footer/>
    </div>
  )
}

export const getServerSideProps = async ({ params }) => {
  const sessionId = params.id
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

  if (!checkoutSession) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      order: {
        id: checkoutSession.id,
        status: checkoutSession.status,
        payment_status: checkoutSession.payment_status,
        customer: {
          email: checkoutSession.customer_email,
        },
      }
    }
  };
};

export default OrderPage
