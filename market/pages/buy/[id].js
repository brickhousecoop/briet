import Head from 'next/head'
import Image from '../../lib/sanityImage'
import Footer from '../../components/footer'

import sanity from "../../lib/sanity"

import styles from '../../styles/Home.module.css'

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
          Purchase digital content for libraries, for patrons, forever.
        </p>

        <p className={styles.description}>
          Powered by <a href="https://controlleddigitallending.org">
            <strong>Controlled Digital Lending</strong>
          </a>
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

          <a href={book.downloadUrl+'?dl'} className={styles.card}>
            <h2>Purchase: ${book.price_usd} &rarr;</h2>
            <p>Your instition may freely loan to patrons: you <b>own</b> the file.</p>
          </a>

          <a href="#" className={styles.card}>
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
  }));

  // We'll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return { paths, fallback: false };
};

export const getStaticProps = async ({ params }) => {
  const book = await sanity.fetch(singleBookQuery, { id: params.id });
  return { props: { book } };
};

export default BookBuyPage
