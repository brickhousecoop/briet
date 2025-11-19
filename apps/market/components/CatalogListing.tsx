import React from 'react';
import styles from '../styles/Home.module.css'

import sanity from '@repo/sanity-client'

import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

interface Book {
  _id: string;
  title: string;
  description: string;
  cover: SanityImageSource;
  authors: Author[];
  publisher: Publisher;
  price_usd: number;
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

const builder = imageUrlBuilder(sanity)

function sanityImgUrl(source: SanityImageSource) {
  return builder.image(source)
}

const CatalogListing = ({ book }: CatalogListingProps) =>
  <a
    href={`/buy/${book._id}`}
    title={book.description}
    className={styles.cataloglisting}
    style={{ backgroundImage: book.cover && `url(${sanityImgUrl(book.cover).height(400).url()})` }}
  >
    <p className="title">{book.title}</p>
    <p className="meta authors">{book.authors[0].name}{book.authors[1] ? <em>, et al.</em> : null}</p>
    <p className="meta publisher">{book.publisher?.name}</p>
    <p className="meta price">{book.price_usd == 0 ? 'FREE' : Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(book.price_usd)}</p>
  </a>

export default CatalogListing
