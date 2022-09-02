import Head from 'next/head'
import Image from 'next/image'
import Footer from '../components/footer'
import styles from '../styles/Home.module.css'
import { readOnlyClient as sanity } from '../lib/sanity'

const catalogQuery = `
  *[_type == "book"] {
    _id,
    title,
    cover,
    authors[]->{ name },
  }
`

const BrietHomepage = ({ books }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>BRIET Marketplace</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          BRIET is <a href="https://controlleddigitallending.org">for keeps</a>.
        </h1>

        <p className={styles.description}>
          Digital content for sale, by creators, to libraries, for ever.
        </p>

        <h2>The Catalog</h2>
        <a href="//server.briet.app">Powered by BookServer</a>

        <div className={styles.grid}>
          {books.map(book =>
            <a key={book._id} href={`/buy/${book._id}`} className={styles.card}>
              <h2>{book.title}</h2>
              <p>{book.authors[0].name}{book.authors[1] ? <em>, et al.</em> : null}</p>
            </a>
          )}
        </div>
      </main>
      <Footer/>
    </div>
  )
}

BrietHomepage.displayName = 'BrietHomepage'

export default BrietHomepage

export const getStaticProps = async ({ params }) => {
  const books = await sanity.fetch(catalogQuery);
  return { props: { books } };
};
