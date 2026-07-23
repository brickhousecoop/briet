import React from 'react';
import styles from '../styles/Home.module.css'
import { imageUrlFor } from '@repo/sanity-client'

export interface Book {
  _id: string;
  title?: string | null;
  description?: string | null;
  cover?: SanityImageSource | null;
  authors?: Array<Author | null> | null;
  publisher?: Publisher | null;
  price_usd?: number | null;
}

interface Author {
  name: string;
}

interface Publisher {
  name: string;
}

interface CatalogListingProps {
  book: Book;
}

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
type SanityImageSource = Parameters<typeof imageUrlFor>[0]

const CatalogListing = ({ book }: CatalogListingProps) => {
  const authors = (book.authors ?? []).filter((author): author is Author => Boolean(author?.name))
  const primaryAuthor = authors[0]?.name ?? 'Unknown author'
  const price = book.price_usd == null
    ? 'Price unavailable'
    : book.price_usd === 0
      ? 'FREE'
      : currencyFormatter.format(book.price_usd)

  return (
    <a
      href={`/buy/${book._id}`}
      title={book.description ?? ''}
      className={styles.cataloglisting}
      style={{ backgroundImage: book.cover ? `url(${imageUrlFor(book.cover).height(400).url()})` : undefined }}
    >
      <p className="title">{book.title ?? 'Untitled'}</p>
      <p className="meta authors">{primaryAuthor}{authors[1] ? <em>, et al.</em> : null}</p>
      <p className="meta publisher">{book.publisher?.name}</p>
      <p className="meta price">{price}</p>
    </a>
  )
}

export default CatalogListing
