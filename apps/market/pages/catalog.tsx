import { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@components/footer'
import CatalogListing from '@components/CatalogListing'
import styles from '@styles/Home.module.css'
import { readOnlyClient as sanity } from 'sanity-client'

const catalogQuery = `
  *[_type == "book"] {
    _id,
    title,
    cover,
    description,
    authors[]->{ name },
    publisher->{ name },
    price_usd,
  }
`

export const metadata: Metadata = {
  title: 'BRIET Marketplace',
  description: 'Ebooks, for libraries, for keeps.',
}

const BrietFullCatalog = ({ books }) => {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          The Whole<br/><Link href="/"><span className="logo">BRIET</span></Link> Catalog
        </h1>

        <p className={styles.description}>
          Ebooks, for libraries, <strong>for keeps</strong>.
        </p>

        <h3>
          <Link href="/">← Back to Featured Collections</Link>
        </h3>

        {books.map(book => <CatalogListing book={book} key={book._id}/>)}

        <h2><Link href="/">← Back to Featured Collections</Link></h2>

        <p className={styles.description}>
          <a href="//server.briet.app">Powered by BookServer</a>
        </p>
      </main>
      <Footer/>
    </div>
  )
}

BrietFullCatalog.displayName = 'BrietFullCatalog'

export default BrietFullCatalog

export const getStaticProps = async () => {
  const books = await sanity.fetch(catalogQuery)

  // console.log(collections) //debug

  return {
    props: {
      books,
    },
    revalidate: 5,
  };
};
