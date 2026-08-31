import Link from 'next/link'
import Head from '@components/head.jsx'
import Footer from '@components/footer'
import CatalogListing, { type Book } from '@components/CatalogListing'
import styles from '@styles/Home.module.css'
import sanity from '@repo/sanity-client'

type Collection = {
  _id: string
  name: string
  slug: { current: string }
  // members has no required rule in the collection schema, and a dangling
  // member reference dereferences to null.
  members: (Book | null)[] | null
}

const collectionsQuery = `
  *[_id == "eca1ce22-f0bf-4205-88e6-3733d723bf05"] {
    featuredCollections[]->{
      _id,
      name,
      slug,
      members[]->{
        _id,
        title,
        cover,
        description,
        authors[]->{ name },
        publisher->{ name },
        price_usd,
      },
    }
  }[0]
`

const singleBookQuery = `
  *[_type == "book" && _id == $id] {
    _id,
    title,
    cover,
    description,
    authors[]->{ name },
    publisher->{ name },
    price_usd,
  }[0]
`

const demoBookId = '3d007a9b-9b9a-4b3a-9530-97d06ba071ed'

const BrietHomepage = ({ collections, demoBook }: { collections: Collection[]; demoBook: Book | null }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>BRIET Bookmarket</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <span className="logo">BRIET</span> Bookmarket
        </h1>

        <p className={styles.description}>
          Ebooks, for libraries, <strong>for keeps</strong>.
        </p>

        {demoBook && <fieldset>
          <legend>A demo of how ebooks from <span className='logo'>BRIET</span> can be loaned to patrons</legend>
          <iframe src={`https://reader.briet.app/borrow/${demoBookId}/`}/>
          <a href={`https://reader.briet.app/borrow/${demoBookId}/`}>&#x26F6; Pop out in full window →</a>

          <p>Book featured:</p>
          <CatalogListing book={demoBook} key={demoBook._id}/>
          <p>Bring this experience to more readers!</p>
        </fieldset>}

        <fieldset>
          <legend>Search the catalog</legend>
          <form action="/search" method="get" className={styles.searchForm}>
            <input
              type="search"
              name="q"
              placeholder="Search by title, author, or keyword…"
              aria-label="Search the BRIET catalog"
            />
            <button type="submit">Search</button>
          </form>
        </fieldset>

        <h2>Featured Collections</h2>

        <div className={styles.grid}>
        {collections.map(collection =>
          <nav key={collection._id}>
            <a href={`#${collection.slug.current}`}><p className={styles.card}>{collection.name}</p></a>
          </nav>
        )}
        </div>

        {collections.map(collection =>
          <fieldset id={collection.slug.current} key={collection._id}>
            <legend>{collection.name}</legend>
            {(collection.members ?? []).filter((book): book is Book => Boolean(book)).map(book =>
              <CatalogListing book={book} key={book._id}/>
            )}
          </fieldset>
        )}

        <h2><Link href="/catalog">View The Whole <span className="logo">BRIET</span> Catalog →</Link></h2>

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

export const getStaticProps = async () => {
  const collections = await sanity.fetch(collectionsQuery)
  const demoBook = await sanity.fetch(singleBookQuery, { id: demoBookId })

  return {
    props: {
      // the settings doc and its featuredCollections field are both optional;
      // a missing one is an empty homepage, not a crash.
      collections: collections?.featuredCollections ?? [],
      demoBook,
    },
    revalidate: 5,
  };
};
