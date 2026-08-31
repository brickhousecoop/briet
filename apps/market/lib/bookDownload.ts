import type { NextApiResponse } from 'next'
import type { createSanityClient } from '@repo/sanity-client'

// Sanity file assets are served from a world-readable CDN URL, so this redirect
// hands out a link that keeps working for anyone it is forwarded to. Whatever the
// calling route decides is the whole of the access control.
// TODO: replace this with a signed expiring URL.

const downloadQuery = `
  *[_type == "book" && _id == $id] {
    "slug": slug.current,
    "url": file.asset->url,
    "extension": file.asset->extension,
  }[0]
`

type BookDownload = { slug: string | null; url: string | null; extension: string | null }

// Redirects to the book's current file, or returns false when it has none.
// Sanity percent-encodes `?dl` into Content-Disposition, so a slug is what keeps
// the saved filename readable; a title would arrive full of `%20`.
export async function redirectToBookFile(
  res: NextApiResponse,
  client: ReturnType<typeof createSanityClient>,
  bookId: string
): Promise<boolean> {
  const book: BookDownload | null = await client.fetch(downloadQuery, { id: bookId })
  if (!book?.url) {
    return false
  }

  res.setHeader('Cache-Control', 'private, no-store')
  res.redirect(302, `${book.url}?dl=${book.slug}.${book.extension}`)
  return true
}
