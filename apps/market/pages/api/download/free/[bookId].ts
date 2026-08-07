import type { NextApiRequest, NextApiResponse } from 'next'
import sanity, { createSanityClient } from '@repo/sanity-client'
import { redirectToBookFile } from '../../../../lib/bookDownload'

type Deps = { sanity?: ReturnType<typeof createSanityClient> }

const priceQuery = `*[_type == "book" && _id == $id][0].price_usd`

// $0 books are downloadable by anyone who knows the book id, which is what the
// catalog already offers. A priced book gets the same 404 as a missing one.
export default async function handler(req: NextApiRequest, res: NextApiResponse, deps: Deps = {}) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end('Method Not Allowed')
  }

  const bookId = req.query.bookId as string
  const client = deps.sanity ?? sanity

  // Priced on every request rather than trusted from the page that linked here.
  const price: number | null = await client.fetch(priceQuery, { id: bookId })
  if (price !== 0) {
    return res.status(404).json({ error: 'not_found' })
  }

  if (!await redirectToBookFile(res, client, bookId)) {
    return res.status(404).json({ error: 'not_found' })
  }
}
