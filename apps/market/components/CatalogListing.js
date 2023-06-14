import styles from '../styles/Home.module.css'
import Link from 'next/link'

import { readOnlyClient as sanity } from 'sanity-client'
import imageUrlBuilder from '@sanity/image-url'

const builder = imageUrlBuilder(sanity)

function sanityImgUrl(source) {
  return imageUrlBuilder(sanity).image(source)
}

const CatalogListing = ({ book }) =>
  <a
    href={`/buy/${book._id}`}
    title={book.description}
    className={styles.cataloglisting}
    style={{ backgroundImage: `url(${sanityImgUrl(book.cover).height(400).url()})` }}
  >
    <p className="title">{book.title}</p>
    <p className="meta authors">{book.authors[0].name}{book.authors[1] ? <em>, et al.</em> : null}</p>
  </a>

CatalogListing.displayName = 'CatalogListing'

export default CatalogListing
