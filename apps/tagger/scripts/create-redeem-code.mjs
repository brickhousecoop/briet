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
// Env (write access required):
//   SANITY_PROJECTID (or SANITY_STUDIO_PROJECTID), SANITY_DATASET (or SANITY_STUDIO_DATASET),
//   SANITY_TOKEN
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

  const client = createClient({
    projectId: process.env.SANITY_PROJECTID || process.env.SANITY_STUDIO_PROJECTID,
    dataset: process.env.SANITY_DATASET || process.env.SANITY_STUDIO_DATASET,
    token: process.env.SANITY_TOKEN,
    apiVersion: '2025-11-18',
    useCdn: false,
  })
  if (!client.config().token) throw new Error('SANITY_TOKEN is required (write access)')

  // Verify every book exists and is importable by Lenny (needs OLID + file).
  const books = await client.fetch(
    `*[_type == "book" && _id in $ids] { _id, title, identifer_ol, "hasFile": defined(file.asset._ref) }`,
    { ids: args.books }
  )
  const found = new Map(books.map((b) => [b._id, b]))
  for (const id of args.books) {
    const b = found.get(id)
    if (!b) throw new Error(`Book not found: ${id}`)
    if (!b.identifer_ol) throw new Error(`Book "${b.title}" (${id}) has no Open Library ID (identifer_ol)`)
    if (!b.hasFile) throw new Error(`Book "${b.title}" (${id}) has no file asset`)
  }

  // Pick a unique code (regenerate on the rare collision).
  let code = args.code ? args.code.trim().toUpperCase() : randomCode()
  while (await client.fetch(`count(*[_type == "redeemCode" && code == $code]) > 0`, { code })) {
    if (args.code) throw new Error(`Code already exists: ${code}`)
    code = randomCode()
  }

  const doc = await client.create({
    _type: 'redeemCode',
    code,
    books: args.books.map((id) => ({ _type: 'reference', _ref: id, _key: id })),
    ...(args.session ? { stripeSessionId: args.session } : {}),
    ...(args.note ? { note: args.note } : {}),
  })

  console.log(`Created redeem code: ${code}`)
  console.log(`  doc:     ${doc._id}`)
  console.log(`  books:   ${books.map((b) => `${b.title} (${b.identifer_ol})`).join(', ')}`)
  if (args.session) console.log(`  session: ${args.session}`)
}

main().catch((err) => {
  console.error(`[✗] ${err.message}`)
  process.exit(1)
})
