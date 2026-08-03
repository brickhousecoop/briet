import Link from 'next/link'
import Head from '@components/head.jsx'
import Footer from '@components/footer'
import CatalogListing, { type Book } from '@components/CatalogListing'
import styles from '@styles/Home.module.css'
import { createSanityClient } from '@repo/sanity-client'

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

const sanity = createSanityClient({ useCdn: false })

const BrietFullCatalog = ({ books }: { books: Book[] }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>BRIET Bookmarket: Catalog</title>
      </Head>

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

  // console.log(books) //debug
  // console.log(books?.length + ' BOOKS') //debug

  return {
    props: {
      books,
    },
    revalidate: 5,
  };
};
