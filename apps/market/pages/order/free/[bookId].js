import { readOnlyClient as sanity } from 'sanity-client'

import Head from '@components/head.jsx'
import Image from '@lib/sanityImage'
import Footer from '@components/footer'
import Link from 'next/link'

import styles from '@styles/Home.module.css'

const singleBookQuery = `
  *[_type == "book" && _id == $id] {
    _id,
    title,
    isPunctumBook,
    "downloadUrl": file.asset -> url,
  }[0]
`

const OrderPage = ({ book }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>{`BRIET Marketplace: Order Placed`}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <span className="logo">BRIET</span> Order Complete
        </h1>

        <Link className={styles.downloadutton} href={book.downloadUrl}>
          Download your book
        </Link>

        {book.isPunctumBook
        ? <p>This is a <Link href="https://punctumbooks.com">punctum</Link> ebook. All punctum books are free, and BRIET aims to make them even more accessible to public libaries. Still: please consider <Link href="https://punctumbooks.com/support/">donating to punctum</Link>.</p>
        : <p>Note that this book is free, but is still subject to the terms of <a href="https://controlleddigitallending.org">Controlled Digital Lending</a> when acquired via BRIET.</p>
        }

        <p>If you have any questions or need to make changes, email <a href="mailto:help@briet.app">help@briet.app</a>.</p>

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
  const book = await sanity.fetch(singleBookQuery, { id: params.bookId })

  if (!book) {
    return {
      notFound: true,
      revalidate: 5
    }
  }

  return {
    props: {
      book
    }
  }
}

export default OrderPage
