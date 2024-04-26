import Head from '@components/head.jsx'
import Footer from '@components/footer'
import CatalogListing from '@components/CatalogListing'
import styles from '@styles/Home.module.css'
import { readOnlyClient as sanity } from 'sanity-client'

const collectionsQuery = `
  *[_type == "collection"] {
    _id,
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

const singleBookQuery = `
  *[_type == "book" && _id == $id] {
    _id,
    title,
    cover,
    description,
    authors[]->{ name },
  }[0]
`

const demoBookId = '3d007a9b-9b9a-4b3a-9530-97d06ba071ed'

const BrietHomepage = ({ books, collections, demoBook }) => {
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
          Lorem ipsum TKTKTKTKTKTKTKTKTKTKT domer set amit etc., etc.
        </p>

        {demoBookId && <fieldset>
          <legend><h3>Hey look a new <span className='logo'>BRIET</span> Reader Demo!</h3></legend>
          <iframe src={`https://reader.briet.app/borrow/${demoBookId}/`}/>
          <a href={`https://reader.briet.app/borrow/${demoBookId}/`}>&#x26F6; Pop out in full window →</a>

          <p>Book featured:</p>
          <CatalogListing book={demoBook} key={demoBook._id}/>
        </fieldset>}

        <p className={styles.description}>
          Ebooks, for libraries, <strong>for keeps</strong>.
        </p>

        <h2>Featured Collections</h2>

        {collections.map(collection =>
          <fieldset id={collection.slug.current} key={collection._id}>
            <legend><h3>{collection.name}</h3></legend>
            {collection.members.map(book =>
              <CatalogListing book={book} key={book._id}/>
            )}
          </fieldset>
        )}

        <h2>The Whole <span className="logo">BRIET</span> Catalog</h2>
        {books.map(book => <CatalogListing book={book} key={book._id}/>)}

        <p className={styles.description}>
          <a href="//server.briet.app">Powered by BookServer</a>
        </p>
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
  const demoBook = await sanity.fetch(singleBookQuery, { id: demoBookId })

  return {
    props: {
      books,
      collections,
      demoBook,
    },
    revalidate: 5,
  };
};
