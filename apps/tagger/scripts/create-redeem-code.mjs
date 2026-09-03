#!/usr/bin/env node
// Create a one-time Lenny redeem code for a bundle of books.
//
// The code is what a library enters in Lenny's importer; Lenny then calls
// GET market.briet.app/api/redeem-lenny/<code> to pull these books in.
//
// Usage:
//   node apps/tagger/scripts/create-redeem-code.mjs --books <bookId> [<bookId> ...] \
//        [--code CODE] [--session STRIPE_SESSION_ID] [--note "..."]
//
// Env (write access required) — accepts the same names the apps' .env.local files
// use, so sourcing one of those is enough:
//   SANITY_PROJECTID | SANITY_STUDIO_PROJECTID | NEXT_PUBLIC_SANITY_PROJECTID
//   SANITY_DATASET   | SANITY_STUDIO_DATASET   | NEXT_PUBLIC_SANITY_DATASET
//   SANITY_WRITE_TOKEN | SANITY_TOKEN (write access required; the write token wins)
//
// Book ids are Sanity document _ids (the UUIDs). The script refuses to create a
// code for a book that lacks an OLID or a file, since Lenny could not import it.

import { createClient } from '@sanity/client'
import { randomBytes } from 'node:crypto'

// No 0/O/1/I to keep codes easy to read aloud.
// Duplicated in apps/market/lib/redeemCode.ts (the checkout minter, another app);
// keep the two alphabets and the XXXX-XXXX shape in sync.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function parseArgs(argv) {
  const args = { books: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--books') {
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) args.books.push(argv[++i])
    } else if (a === '--code') args.code = argv[++i]
    else if (a === '--session') args.session = argv[++i]
    else if (a === '--note') args.note = argv[++i]
    else throw new Error(`Unknown argument: ${a}`)
  }
  if (args.books.length === 0) throw new Error('Pass at least one --books <bookId>')
  return args
}

function randomCode() {
  const bytes = randomBytes(8)
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length])
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  // Script only writes, so the write-scoped token wins when both are set
  // (market's SANITY_TOKEN is read-only and would 403 here).
  const projectId = process.env.SANITY_PROJECTID
    || process.env.SANITY_STUDIO_PROJECTID
    || process.env.NEXT_PUBLIC_SANITY_PROJECTID
  const dataset = process.env.SANITY_DATASET
    || process.env.SANITY_STUDIO_DATASET
    || process.env.NEXT_PUBLIC_SANITY_DATASET
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_TOKEN
  if (!projectId) throw new Error('Set SANITY_PROJECTID (or SANITY_STUDIO_PROJECTID / NEXT_PUBLIC_SANITY_PROJECTID)')
  if (!dataset) throw new Error('Set SANITY_DATASET (or SANITY_STUDIO_DATASET / NEXT_PUBLIC_SANITY_DATASET)')
  if (!token) throw new Error('Set SANITY_WRITE_TOKEN or SANITY_TOKEN (write access required)')

  const client = createClient({ projectId, dataset, token, apiVersion: '2025-11-18', useCdn: false })

  // Verify every book exists and is importable by Lenny (needs OLID + file).
  const books = await client.fetch(
    `*[_type == "book" && _id in $ids] { _id, title, identifier_ol, "hasFile": defined(file.asset._ref) }`,
    { ids: args.books }
  )
  const found = new Map(books.map((b) => [b._id, b]))
  for (const id of args.books) {
    const b = found.get(id)
    if (!b) throw new Error(`Book not found: ${id}`)
    if (!b.identifier_ol) throw new Error(`Book "${b.title}" (${id}) has no Open Library ID (identifier_ol)`)
    if (!b.hasFile) throw new Error(`Book "${b.title}" (${id}) has no file asset`)
  }

  // Pick a unique code (regenerate on the rare collision).
  let code = args.code ? args.code.trim().toUpperCase() : randomCode()
  while (await client.fetch(`count(*[_type == "redeemCode" && code == $code]) > 0`, { code })) {
    if (args.code) throw new Error(`Code already exists: ${code}`)
    code = randomCode()
  }

  let doc
  try {
    doc = await client.create({
      _type: 'redeemCode',
      code,
      books: args.books.map((id) => ({ _type: 'reference', _ref: id, _key: id })),
      ...(args.session ? { stripeSessionId: args.session } : {}),
      ...(args.note ? { note: args.note } : {}),
    })
  } catch (err) {
    // A read-only token (e.g. market's SANITY_TOKEN) clears every read above and
    // dies here — turn the bare 401/403 into the fix.
    if (err?.statusCode !== 401 && err?.statusCode !== 403) throw err
    throw new Error(
      `Sanity rejected the write with ${err.statusCode} — the token is invalid or read-only; set SANITY_WRITE_TOKEN (market's SANITY_TOKEN is read-only)`
    )
  }

  console.log(`Created redeem code: ${code}`)
  console.log(`  doc:     ${doc._id}`)
  console.log(`  books:   ${books.map((b) => `${b.title} (${b.identifier_ol})`).join(', ')}`)
  if (args.session) console.log(`  session: ${args.session}`)
}

main().catch((err) => {
  console.error(`[✗] ${err.message}`)
  process.exit(1)
})
