import Stripe from 'stripe'

import Head from '@components/head.jsx'
import Image from '@lib/sanityImage'
import Footer from '@components/footer'

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
          BRIET Order Pending
        </h1>

        <p>We are reviewing your order and will reach out to {order.customer.email} with your download if you’re approved to implement <a href="https://controlleddigitallending.org">CDL</a>.</p>

        <p>If you have any questions or need to make changes, email <a href="mailto:help@briet.app">help@briet.app</a>.</p>

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
