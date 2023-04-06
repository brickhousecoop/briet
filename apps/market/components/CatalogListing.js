import styles from '../styles/Home.module.css'
import Link from 'next/link'

const CatalogListing = ({ book }) =>
  <a key={book._id} href={`/buy/${book._id}`} className={styles.cataloglisting}>
    <h2>{book.title}</h2>
    <p>{book.authors[0].name}{book.authors[1] ? <em>, et al.</em> : null}</p>
  </a>

CatalogListing.displayName = 'CatalogListing'

export default CatalogListing
