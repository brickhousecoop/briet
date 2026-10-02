import type { NextApiRequest, NextApiResponse } from 'next'
import { createSanityClient, createSanityWriteClient } from '@repo/sanity-client'

// Deps are injected in tests so the one-shot claim runs against a fake Content
// Lake via the real @sanity/client. The `write` fallback is built lazily (see
// the claim site): never hoist it into a default param, or every read — including
// 404/422 paths on deployments without SANITY_WRITE_TOKEN — would demand the token.
type Client = ReturnType<typeof createSanityClient>
type Deps = { read?: Client; write?: Client }

type RedeemableBook = { olid: string | null; title: string; url: string | null }
type RedeemCode = { _id: string; redeemedAt: string | null; books: RedeemableBook[] | null }

const codeQuery = `
  *[_type == "redeemCode" && code == $code] {
    _id,
    redeemedAt,
    "books": books[] -> {
      "olid": identifier_ol,
      "title": title,
      "url": file.asset->url,
    },
  }[0]
`

// TODO: replace `url` with a signed expiring URL.

// Lenny's importer (ArchiveLabs/lenny#193) GETs this endpoint with a one-time
// code and expects { books: [{ olid, url, title }] }. It treats any 4xx (other
// than 429) as "invalid or already redeemed" and 5xx as "upstream unavailable",
// so the status codes below are chosen to map onto that handling.
export default async function handler(req: NextApiRequest, res: NextApiResponse, deps: Deps = {}) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end('Method Not Allowed')
  }

  const code = String(req.query.code || '').trim().toUpperCase()
  if (!code) {
    return res.status(404).json({ error: 'not_found' })
  }

  const record: RedeemCode | null = await (deps.read ?? createSanityClient()).fetch(codeQuery, { code })
  if (!record) {
    return res.status(404).json({ error: 'not_found' })
  }
  if (record.redeemedAt) {
    return res.status(400).json({ error: 'already_redeemed' })
  }

  // Drop any book missing an OLID or file rather than hand Lenny a half-record
  // it would have to reject anyway. Resolve this before claiming: a bundle with
  // nothing importable is a cataloguing gap, and burning the buyer's code over
  // it would destroy the purchase to report a problem the Studio can still fix.
  const books = (record.books || []).filter((b) => b.olid && b.url)
  if (books.length === 0) {
    return res.status(422).json({ error: 'nothing_to_import' })
  }

  // Atomic one-shot claim: the patch only matches while redeemedAt is unset, so
  // of any concurrent redemptions exactly one patches a document; the rest
  // patch zero and are told the code is spent.
  //
  // Two shapes here are load-bearing and fail silently if changed. The query must
  // be a full `*[...]` expression: given a bare filter Sanity matches nothing,
  // reports no error, and the code is refused as spent while never being claimed.
  // And returnDocuments:false is what makes the result readable at all, since a
  // query selection otherwise resolves to a bare array of patched documents that
  // carries none of the mutation results counted below.
  let claimed: boolean
  try {
    // Built here rather than at module scope: a deployment without the write token
    // must still build and serve reads, so the client is created only when claiming.
    const result = await (deps.write ?? createSanityWriteClient())
      .patch({ query: '*[_id == $id && !defined(redeemedAt)]', params: { id: record._id } })
      .set({ redeemedAt: new Date().toISOString() })
      .commit({ returnDocuments: false })
    claimed = result.results.length > 0
  } catch (err) {
    console.error(`redeem-lenny: failed to claim ${record._id}`, err)
    return res.status(500).json({ error: 'claim_failed' })
  }
  if (!claimed) {
    return res.status(400).json({ error: 'already_redeemed' })
  }

  return res.status(200).json({ books })
}
