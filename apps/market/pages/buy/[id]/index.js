import Head from 'next/head'
import Image from '../../../lib/sanityImage'
import Footer from '../../../components/footer'

import { readOnlyClient as sanity } from 'sanity-client'
import { loadStripe } from '@stripe/stripe-js'

import styles from '../../../styles/Home.module.css'

const allBookIdsQuery = `
  *[_type == "book"] { _id }
`

const singleBookQuery = `
  *[_type == "book" && _id == $id] {
    _id,
    title,
    cover,
    authors[] -> { _id, name, uri },
    price_usd,
    "downloadUrl": file.asset -> url
  }[0]
`

const BookBuyPage = ({ book }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>{`BRIET Marketplace: ${book.title}`}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          BRIET Marketplace
        </h1>

        <p className={styles.description}>
          Purchase digital books for libraries, for patrons, forever.
        </p>

        <p className={styles.description}>
          <strong>Not a librarian?</strong> Send this page on to your local library. We are BRIET, and our mission is to sell ebooks to libraries, so they can be lent freely to you. In fact, we <em>only</em> sell to libraries, so that they can use <a href="https://controlleddigitallending.org">controlled digital lending</a> to legally lend digital books to library patrons.
        </p>

        <div className={styles.grid}>
          <div className={styles.float}>
            <Image
              sanityAsset={book.cover}
              alt={`Cover of book titled ${book.title}`}
            />
          </div>

          <div className={styles.float}>
            <h2>{book.title}</h2>
            {book.authors.map(author => <p key={author._id}><a href={author.uri}>{author.name}</a></p>)}
          </div>

          <form action="/api/checkout_sessions" method="POST">
            <input type="hidden" id="briet_item_id" name="briet_item_id" value={book._id}/>
            <button type="submit" role="link" className={styles.card}>
              <h2>Purchase: ${book.price_usd} &rarr;</h2>
              <p>Your institution may freely loan to patrons: you <b>own</b> the file.</p>
            </button>
          </form>

          <a href={`/buy/${book._id}/marc`} className={styles.card}>
            <h2>MARC record &darr;</h2>
            <p>For integration into library cataloging systems</p>
          </a>

          <p className={styles.description}>
            Powered by <a href="https://controlleddigitallending.org">
              <strong>Controlled Digital Lending</strong>
            </a>
          </p>
        </div>
      </main>

      <Footer/>
    </div>
  )
}

export const getStaticPaths = async () => {
  const books = await sanity.fetch(allBookIdsQuery);

  const paths = books.map(book => ({
    params: { id: book._id }
  }));

  return {
    paths,
    fallback: 'blocking'
  };
};

export const getStaticProps = async ({ params }) => {
  const book = await sanity.fetch(singleBookQuery, { id: params.id });
  if (!book) {
    return {
      notFound: true,
      revalidate: 5
    }
  }
  return {
    props: { book },
    revalidate: 5
  };
};

export default BookBuyPage
