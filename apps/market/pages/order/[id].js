import Link from 'next/link'

import Head from '@components/head.jsx'
import Footer from '@components/footer'
import { stripe, isOrderApproved } from '@lib/stripe'
import { readOnlyClient as sanity } from '@repo/sanity-client'

import styles from '../../styles/Home.module.css'

const lineItemsBookQuery = `
  *[_type == "book" && _id in $ids] {
    _id,
    title,
  }
`

const OrderPage = ({ order, books }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>{`BRIET Bookmarket: Order ${order.approved ? 'Complete' : 'Pending'}`}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <span className="logo">BRIET</span> Order {order.approved ? 'Complete' : 'Pending'}
        </h1>

        {order.approved ? (
          <>
            <p>Your order is approved. Download your book{books.length > 1 ? 's' : ''} below.</p>
            <ul>
              {books.map(book => (
                <li key={book._id}>
                  <Link href={`/download/${book._id}`} className={styles.downloadbutton}>
                    Download &ldquo;{book.title}&rdquo; &darr;
                  </Link>
                </li>
              ))}
            </ul>
            <p>You can also find this in your <Link href="/account/library">library</Link> at any time.</p>
          </>
        ) : (
          <>
            <p>We are reviewing your order and will reach out to {order.customer.email} with your download if you’re approved to implement <a href="https://controlleddigitallending.org">CDL</a>.</p>
            <p>You can track this order any time at <Link href="/account/orders">your order history</Link>.</p>
          </>
        )}

        <p>If you have any questions or need to make changes, email <a href="mailto:help@briet.app">help@briet.app</a>.</p>

        <p>Status: {order.status}</p>
        <p>Payment Status: {order.payment_status}</p>
      </main>

      <Footer/>
    </div>
  )
}

export const getServerSideProps = async ({ params }) => {
  const sessionId = params.id
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items'],
  })

  if (!checkoutSession) {
    return { notFound: true }
  }

  const approved = isOrderApproved(checkoutSession)

  // Prefer the book id we stamped into the session metadata; fall back to
  // looking up line items by their product images (older sessions).
  const bookIds = []
  if (checkoutSession.metadata?.briet_book_id) {
    bookIds.push(checkoutSession.metadata.briet_book_id)
  }

  const books = bookIds.length
    ? await sanity.fetch(lineItemsBookQuery, { ids: bookIds })
    : []

  return {
    props: {
      order: {
        id: checkoutSession.id,
        status: checkoutSession.status,
        payment_status: checkoutSession.payment_status,
        approved,
        customer: {
          email: checkoutSession.customer_email || checkoutSession.customer_details?.email || '',
        },
      },
      books,
    }
  };
};

export default OrderPage
