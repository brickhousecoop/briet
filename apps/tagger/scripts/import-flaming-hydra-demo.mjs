#!/usr/bin/env node
// One-off import of the Flaming Hydra demo epubs into the `development` dataset.
//
// What it does, per epub in the demo zip:
//   1. skips it if a book with that title already exists
//   2. uploads the epub FILE to the dataset's asset store
//   3. creates (or reuses) the publisher "Flaming Hydra" and author docs
//   4. creates a `book` doc: title, slug, description, releaseDate, price,
//      publisher, authors, file (+ optional cover image)
//   5. ensures a "Flaming Hydra" collection holds the imported books and that the
//      collection is first in the homepage settings (`featuredCollections`)
//
// Usage (from apps/tagger, token loaded from .vercel/.env.development.local or env).
// --dir defaults to the "Flaming Hydra Demo" folder of the demo zip unzipped into /tmp/flaming-hydra:
//   node scripts/import-flaming-hydra-demo.mjs [--dir /path/to/epubs] [--dry]
//   node scripts/import-flaming-hydra-demo.mjs --only suitors \
//     --file ~/Downloads/ben-ehrenreich_the-suitors_9-8-26.epub --cover /tmp/suitors_epub/epub/images/cover.jpg
//
// Author docs matched by exact name are reused, otherwise created. "Defector" (primary
// creator of the digest epub) is a corporate byline treated as part of the title, not an
// author doc -- the per-article `article-author-*` creators in that epub are skipped.

import { createClient } from '@sanity/client'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const DEFAULT_DIR = '/tmp/flaming-hydra/Flaming Hydra Demo'
const PUBLISHER_NAME = 'Flaming Hydra'
const COLLECTION_SLUG = 'flaming-hydra'
const SETTINGS_ID = 'eca1ce22-f0bf-4205-88e6-3733d723bf05' // pageSettings: homepage featuredCollections
const PRICE = 0 // default when a book has no `price`

const dry = process.argv.includes('--dry')
const dirIdx = process.argv.indexOf('--dir')
const DIR = dirIdx > -1 ? process.argv[dirIdx + 1] : DEFAULT_DIR

function flag(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : null
}

// --only <substring> imports a single title; --file/--cover override its paths.
const ONLY = flag('only')?.toLowerCase() ?? null
const FILE = flag('file')
const COVER = flag('cover')
if ((FILE || COVER) && !ONLY) {
  console.error('ERROR: --file/--cover require --only')
  process.exit(1)
}

// ---- env --------------------------------------------------------------------
const vercelEnv = path.resolve(process.cwd(), '../../.vercel/.env.development.local')
if (!process.env.SANITY_TOKEN && existsSync(vercelEnv)) {
  for (const line of readFileSync(vercelEnv, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
  }
}
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_TOKEN
if (!token) {
  console.error('ERROR: need SANITY_TOKEN/SANITY_WRITE_TOKEN (or .vercel/.env.development.local)')
  process.exit(1)
}

const client = createClient({
  projectId: '3lm68n5v',
  dataset: 'development',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

// ---- the books --------------------------------------------------------------
// releaseDate inferred from the filename stamp (e.g. "..._8-25-26" -> 2026-08-25,
// "..._9-3-26" -> 2026-09-03). Covers: only the September 2025 zip includes one.
const BOOKS = [
  {
    file: 'defector-weekly-digest_may_8-25-26.epub',
    title: 'Defector Weekly Digest (May 2026)',
    authors: [], // primary creator is the corporate byline "Defector"; per-article creators omitted
    releaseDate: '2026-05-01T00:00:00Z', // digest covers May 2026 (file stamped 8-25-26)
    description:
      'Top stories from Defector, an employee-owned website covering sports, politics, TV, movies, science, and weird shit.',
  },
  {
    file: 'game-show-zine_8-25-26.epub',
    title: 'Game Show Zine',
    authors: ['Joe MacLeod'],
    releaseDate: '2026-08-25T00:00:00Z',
    description: null,
  },
  {
    file: 'the-suitors_ben-ehrenreich_8-25-26.epub',
    title: 'The Suitors',
    authors: ['Ben Ehrenreich'],
    releaseDate: '2026-09-08T00:00:00Z', // from the revised 9-8-26 epub
    description: 'A fresh, frenzied, fantastical 21st-century reimagining of The Odyssey.',
    price: 5,
    identifier_ol: 'OL8787253M',
  },
  {
    file: 'tom-scocca_essays_9-3-26.epub',
    title: 'Tom Scocca: Essays',
    authors: ['Tom Scocca'],
    releaseDate: '2026-09-03T00:00:00Z',
    description: null,
  },
  {
    file: 'The Awl The Book _eBook_Final - Unknown.epub',
    title: 'The Book of the Awl',
    authors: [],
    releaseDate: null,
    description: 'A compendium of the best work from The Awl.',
  },
  {
    file: 'Flaming Hydra September 2025/Flaming Hydra September 2025 - Unknown.epub',
    title: 'Flaming Hydra September 2025',
    authors: [],
    releaseDate: '2025-09-29T00:00:00Z',
    description: "A compendium of work from Flaming Hydra's writers for September 2025.",
    cover: 'Flaming Hydra September 2025/cover.jpg',
  },
]

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100)
}

async function ensurePublisher() {
  const existing = await client.fetch(
    `*[_type == "publisher" && name == $name][0]{_id}`,
    { name: PUBLISHER_NAME }
  )
  if (existing) return existing._id
  const _id = randomUUID()
  if (!dry) await client.create({ _id, _type: 'publisher', name: PUBLISHER_NAME })
  return _id
}

async function ensureAuthor(name) {
  const existing = await client.fetch(
    `*[_type == "author" && name == $name][0]{_id}`,
    { name }
  )
  if (existing) return existing._id
  const _id = randomUUID()
  if (!dry) {
    await client.create({
      _id,
      _type: 'author',
      name,
      slug: { _type: 'slug', current: slugify(name) },
    })
  }
  return _id
}

async function importBook(book, publisherId) {
  const existing = await client.fetch(
    `*[_type == "book" && title == $title][0]{_id, title}`,
    { title: book.title }
  )
  if (existing) {
    console.log(`  skip (exists): ${book.title}  [${existing._id}]`)
    return existing._id
  }

  const filePath = FILE ? path.resolve(FILE) : path.join(DIR, book.file)
  if (!existsSync(filePath)) throw new Error(`missing file: ${filePath}`)

  let fileRef, coverRef
  console.log(`  upload epub: ${filePath}`)
  if (!dry) {
    const f = await client.assets.upload('file', readFileSync(filePath), {
      filename: path.basename(filePath),
    })
    fileRef = f._id
  }
  const coverPath = COVER ? path.resolve(COVER) : book.cover ? path.join(DIR, book.cover) : null
  if (coverPath && existsSync(coverPath)) {
    console.log(`  upload cover: ${coverPath}`)
    if (!dry) {
      const c = await client.assets.upload('image', readFileSync(coverPath), {
        filename: path.basename(coverPath),
      })
      coverRef = c._id
    }
  }

  const authorIds = []
  for (const name of book.authors) authorIds.push(await ensureAuthor(name))

  const doc = {
    _type: 'book',
    title: book.title,
    slug: { _type: 'slug', current: slugify(book.title) },
    description: book.description ?? undefined,
    releaseDate: book.releaseDate ?? undefined,
    price_usd: book.price ?? PRICE,
    identifier_ol: book.identifier_ol ?? undefined,
    isPunctumBook: false,
    publisher: publisherId ? { _type: 'reference', _ref: publisherId } : undefined,
    authors: authorIds.map((_ref, i) => ({
      _type: 'reference',
      _ref,
      _key: `a${i}`,
    })),
    file: fileRef ? { _type: 'file', asset: { _type: 'reference', _ref: fileRef } } : undefined,
    cover: coverRef ? { _type: 'image', asset: { _type: 'reference', _ref: coverRef } } : undefined,
  }

  if (dry) {
    console.log(`  DRY would create:`, JSON.stringify({ ...doc, file: !!fileRef, cover: !!coverRef }, null, 2))
    return undefined
  } else {
    const created = await client.create(doc)
    console.log(`  created: ${created._id}  ${book.title}`)
    return created._id
  }
}

// Puts the imported books in a "Flaming Hydra" collection and features that
// collection on the homepage (pageSettings.featuredCollections).
async function featureCollection(bookIds) {
  const existing = await client.fetch(
    `*[_type == "collection" && slug.current == $slug][0]{_id, "members": members[]._ref}`,
    { slug: COLLECTION_SLUG }
  )
  const _id = existing?._id ?? randomUUID()

  if (dry) {
    console.log(`\nDRY collection ${_id} would hold ${bookIds.join(', ') || '(nothing)'}`)
    return
  }

  if (!existing) {
    await client.create({
      _id,
      _type: 'collection',
      name: PUBLISHER_NAME,
      slug: { _type: 'slug', current: COLLECTION_SLUG },
      members: bookIds.map((_ref) => ({ _type: 'reference', _ref, _key: randomUUID() })),
    })
    console.log(`\ncollection ${PUBLISHER_NAME}: created ${_id}`)
  } else {
    const current = existing.members ?? []
    const missing = bookIds.filter((id) => !current.includes(id))
    if (missing.length) {
      await client
        .patch(_id)
        .append('members', missing.map((_ref) => ({ _type: 'reference', _ref, _key: randomUUID() })))
        .commit()
      console.log(`\ncollection ${PUBLISHER_NAME}: added ${missing.join(', ')}`)
    } else {
      console.log(`\ncollection ${PUBLISHER_NAME}: already holds every imported book`)
    }
  }

  const settings = await client.fetch(`*[_id == $id][0]{featuredCollections}`, { id: SETTINGS_ID })
  const refs = settings?.featuredCollections ?? []
  if (refs[0]?._ref === _id) {
    console.log(`homepage: ${PUBLISHER_NAME} is already the first featured collection`)
    return
  }
  const ref = refs.find((r) => r._ref === _id) ?? { _type: 'reference', _ref: _id, _key: COLLECTION_SLUG }
  await client
    .patch(SETTINGS_ID)
    .set({ featuredCollections: [ref, ...refs.filter((r) => r._ref !== _id)] })
    .commit()
  console.log(`homepage: ${PUBLISHER_NAME} is now the first featured collection`)
}

async function main() {
  console.log(`dataset: ${client.config().dataset}   dir: ${DIR}   dry: ${dry}`)
  const publisherId = await ensurePublisher()
  console.log(`publisher ${PUBLISHER_NAME}: ${publisherId}`)
  const books = ONLY ? BOOKS.filter((b) => b.title.toLowerCase().includes(ONLY)) : BOOKS
  if (!books.length) throw new Error(`no book matches --only ${ONLY}`)
  const bookIds = []
  for (const book of books) {
    console.log(`\n== ${book.title}`)
    const id = await importBook(book, publisherId)
    if (id) bookIds.push(id)
  }
  await featureCollection(bookIds)
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
