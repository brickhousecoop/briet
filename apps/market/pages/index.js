import Head from '@components/head.jsx'
import Footer from '@components/footer'
import CatalogListing from '@components/CatalogListing'
import styles from '@styles/Home.module.css'
import { readOnlyClient as sanity } from 'sanity-client'

const collectionsQuery = `
  *[_type == "collection"] {
    name,
    slug,
    members[]->{
      _id,
      title,
      cover,
      description,
      authors[]->{ name },
    },
  }
`

const catalogQuery = `
  *[_type == "book"] {
    _id,
    title,
    cover,
    description,
    authors[]->{ name },
  }
`

const BrietHomepage = ({ books, collections }) => {
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
          Ebooks, for libraries, <strong>for keeps</strong>.
        </p>
        <a href="//server.briet.app">Powered by BookServer</a>

        <h2>Curated Collections</h2>

        {collections.map(collection =>
          <fieldset id={collection.slug.current}>
            <legend>{collection.name}</legend>
            {collection.members.map(book =>
              <CatalogListing book={book} key={book._id}/>
              )}
          </fieldset>
        )}

        <h2>The Whole <span className="logo">BRIET</span> Catalog</h2>
        {books.map(book => <CatalogListing book={book} key={book._id}/>)}
      </main>
      <Footer/>
    </div>
  )
}

BrietHomepage.displayName = 'BrietHomepage'

export default BrietHomepage

export const getStaticProps = async ({ params }) => {
  const books = await sanity.fetch(catalogQuery)
  const collections = await sanity.fetch(collectionsQuery)

  console.log(await collections)

  return {
    props: { books, collections },
    revalidate: 5,
  };
};
