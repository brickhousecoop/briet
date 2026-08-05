import Link from 'next/link'
import Footer from '@components/footer'
import CatalogListing from '@components/CatalogListing'
import type { Book } from '@components/CatalogListing'
import styles from '@styles/Home.module.css'
import { createSanityClient } from '@repo/sanity-client'
import type { GetServerSideProps } from 'next'

const MAX_RESULTS = 100
const searchQuery = `
  *[_type == "book" && (
    title match $qPrefix ||
    array::join(authors[]->name, " ") match $q ||
    description match $q
  )] {
    _id, title, cover, description,
    authors[]->{ name },
    publisher->{ name },
    price_usd,
  }
`

const sanity = createSanityClient({ useCdn: false })

// Search via GROQ but score and resort here. Mostly for clarity. Probably move
//  to GROQ for production
function scoreBook(book: Book, tokens: string[]): number {
  const title = (book.title ?? '').toLowerCase()
  const authors = (book.authors ?? []).map(a => a?.name ?? '').join(' ').toLowerCase()
  const description = (book.description ?? '').toLowerCase()
  // Score matches like: title matches > author matches > description matches
  return tokens.reduce((s, t) => s
    + (title.includes(t) ? 3 : 0)
    + (authors.includes(t) ? 2 : 0)
    + (description.includes(t) ? 1 : 0)
  , 0)
}

interface SearchProps {
  q: string
  books: Book[]
}

const Search = ({ q, books }: SearchProps) => (
  <div className={styles.container}>
    <main className={styles.main}>
      <h1 className={styles.title}>
        <Link href="/"><span className="logo">BRIET</span></Link> Bookmarket
      </h1>

      <form action="/search" method="get" className={styles.searchForm}>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Title, author, keyword…"
          aria-label="Search the BRIET catalog"
        />
        <button type="submit">Search</button>
      </form>

      {q && (
        <p style={{ textAlign: 'center' }}>
          {books.length} {books.length === 1 ? 'result' : 'results'} for <strong>&quot;{q}&quot;</strong>
        </p>
      )}

      {books.map(book => <CatalogListing book={book} key={book._id} />)}

      <h2><Link href="/">← Back to Featured Collections</Link></h2>
    </main>
    <Footer />
  </div>
)

Search.displayName = 'Search'

export default Search

export const getServerSideProps: GetServerSideProps<SearchProps> = async ({ query }) => {
  const q = (Array.isArray(query.q) ? query.q[0] : query.q ?? '').trim()
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)

  if (tokens.length === 0) return { props: { q, books: [] } }

  const matched: Book[] = await sanity.fetch(searchQuery, {
    q: tokens.join(' '),                         // only match whole words for authors and description
    qPrefix: tokens.map(t => `${t}*`).join(' '), // wildcard prefix match for title
  })

  const books = matched
    .map(book => ({ book, score: scoreBook(book, tokens) }))
    .sort((a, b) => b.score - a.score || (a.book.title ?? '').localeCompare(b.book.title ?? ''))
    .slice(0, MAX_RESULTS)
    .map(({ book }) => book)

  return { props: { q, books } }
}
