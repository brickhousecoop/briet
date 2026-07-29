import type { NextApiRequest, NextApiResponse } from 'next'
import { createSanityClient } from '@repo/sanity-client'

// Reads can use the CDN; the one-shot claim is a mutation and must bypass it.
const read = createSanityClient()
const write = createSanityClient({ useCdn: false })

type RedeemableBook = { olid: string | null; title: string; url: string | null }
type RedeemCode = { _id: string; redeemedAt: string | null; books: RedeemableBook[] | null }

const codeQuery = `
  *[_type == "redeemCode" && code == $code] {
    _id,
    redeemedAt,
    "books": books[] -> {
      "olid": identifer_ol,
      "title": title,
      "url": file.asset->url,
    },
  }[0]
`

// Lenny's importer (ArchiveLabs/lenny#193) GETs this endpoint with a one-time
// code and expects { books: [{ olid, url, title }] }. It treats any 4xx (other
// than 429) as "invalid or already redeemed" and 5xx as "upstream unavailable",
// so the status codes below are chosen to map onto that handling.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end('Method Not Allowed')
  }

  const code = String(req.query.code || '').trim().toUpperCase()
  if (!code) {
    return res.status(404).json({ error: 'not_found' })
  }

  const record: RedeemCode | null = await read.fetch(codeQuery, { code })
  if (!record) {
    return res.status(404).json({ error: 'not_found' })
  }
  if (record.redeemedAt) {
    return res.status(400).json({ error: 'already_redeemed' })
  }

  // Atomic one-shot claim: the patch only matches while redeemedAt is unset, so
  // of any concurrent redemptions exactly one patches a document; the rest
  // patch zero and are told the code is spent.
  let claimed: boolean
  try {
    const result = await write
      .patch({ query: '_id == $id && !defined(redeemedAt)', params: { id: record._id } })
      .set({ redeemedAt: new Date().toISOString() })
      .commit()
    claimed = (result.results || []).length > 0
  } catch (err) {
    console.error(`redeem-lenny: failed to claim code ${code}`, err)
    return res.status(500).json({ error: 'claim_failed' })
  }
  if (!claimed) {
    return res.status(400).json({ error: 'already_redeemed' })
  }

  // Drop any book missing an OLID or file rather than hand Lenny a half-record
  // it would have to reject anyway.
  const books = (record.books || []).filter((b) => b.olid && b.url)
  return res.status(200).json({ books })
}
