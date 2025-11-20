import sanity from '@repo/sanity-client'

import Head from '@components/head.jsx'
import Image from '@lib/sanityImage'
import Footer from '@components/footer'
import Link from 'next/link'
import va from '@vercel/analytics'

import styles from '../../../styles/Home.module.css'

const allBookIdsQuery = `
  *[_type == "book"] { _id }
`

const singleBookQuery = `
  *[_type == "book" && _id == $id] {
    _id,
    title,
    description,
    cover,
    authors[] -> { _id, name, uri },
    price_usd,
    isPunctumBook,
  }[0]
`

const BookBuyPage = ({ book }) => {
  const trackCheckout = ({ bookTitle, price }) => {
    va.track('Checkout', { title: bookTitle, price: price })
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>{`BRIET Bookmarket: ${book.title}`}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <Link href="/">
          <h1 className={styles.title}><span className="logo">BRIET</span>Marketplace</h1>
        </Link>

        <p className={styles.description}>
          Purchase digital books for libraries, for patrons, forever.
        </p>

        {book.isPunctumBook ?
          <p className={styles.instructions}>
            This is a <Link href="https://punctumbooks.com">punctum</Link> ebook. Please consider their <Link href="https://punctumbooks.com/supporting-library-membership-program/">Supporting Library Membership Program</Link>.
          </p>
        :
          <p className={styles.instructions}>
            <strong>Not a librarian?</strong> Send this page on to your local library. We are BRIET, and our mission is to sell ebooks to libraries, so they can be loaned freely to you.
          </p>
        }

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

          <p className={styles.description}>{book.description}</p>

            {book.price_usd > 0 ?
              <form action="/api/checkout_sessions" method="POST">
                <input type="hidden" id="briet_item_id" name="briet_item_id" value={book._id}/>
                <button type="submit" role="link" className={styles.card} onClick={trackCheckout}>
                  <h2>Purchase: ${book.price_usd} &rarr;</h2>
                  <p>Your institution may freely loan to patrons: you <em>own</em> the file.</p>
                </button>
              </form>
            :
              <Link href={`/order/free/${book._id}`} className={styles.downloadbutton} onClick={trackCheckout}>
                <h2>Order: $0 &rarr;</h2>
                <p>Your institution may freely loan to patrons: you <em>own</em> the file.</p>
              </Link>
            }

          <a href={`/buy/${book._id}/marc`} className={styles.card}>
            <h2>MARC record &darr;</h2>
            <p>For integration into library cataloging systems</p>
          </a>
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
  })).slice(0, 10); // sample 10 paths to prerender mostly just to learn getStaticPaths

  return {
    paths,
    fallback: 'blocking'
  };
};

export const getStaticProps = async ({ params }) => {
  const book = await sanity.fetch(singleBookQuery, { id: params.id })

  if (!book) {
    return {
      notFound: true,
      revalidate: 5
    }
  }
  return {
    props: {
      book,
    },
    revalidate: 5
  }
}

export default BookBuyPage
