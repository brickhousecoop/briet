import Head from '@components/head.jsx'
import Footer from '@components/footer'
import CatalogListing from '@components/CatalogListing'
import styles from '@styles/Home.module.css'
import { readOnlyClient as sanity } from 'sanity-client'

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
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <span className="logo">BRIET</span> Marketplace
        </h1>

        <p className={styles.description}>
          Digital content for sale, by creators, to libraries, for ever.
        </p>

        <h2>The Catalog</h2>
        <a href="//server.briet.app">Powered by BookServer</a>

        <div className={styles.grid}>
          {books.map(book => <CatalogListing book={book} key={book._id}/>)}
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
  return {
    props: { books },
    revalidate: 5
  };
};
