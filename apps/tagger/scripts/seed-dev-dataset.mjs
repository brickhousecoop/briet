#!/usr/bin/env node
// Seed the `development` Sanity dataset with the documents the market homepage needs.
//
// Why this exists
// ---------------
// market's homepage (apps/market/pages/index.tsx) reads a `pageSettings` singleton and
// its `featuredCollections`, plus a demo book. That content lives only in the `production`
// dataset. Local dev/builds read `development` (NEXT_PUBLIC_SANITY_DATASET), where the
// content is absent, so `getStaticProps` crashes on null and `next build` fails on `/`.
//
// This copies just the homepage's document closure (pageSettings -> featured collections
// -> member books + demo book -> their authors/publishers) and the books' cover images
// from a production export tarball into `development`. Ebook `file` assets are dropped
// (multi-GB, unused by the homepage) so refs to them dangle harmlessly.
//
// The import is additive: `--missing` never overwrites documents already in `development`.
// Asset ids are content-hash based and the export bundles the original binaries, so cover
// references stay valid after upload.
//
// Usage
// -----
//   node apps/tagger/scripts/seed-dev-dataset.mjs [--backup <production-export.tar.gz>] \
//        [--target development] [--pack <seed.tar.gz>] [--no-import]
//
// - --backup   Path to a `sanity dataset export` tarball of production. Defaults to the
//              newest backups/sanity/production-*.tar.gz.
// - --target   Dataset to seed. Default: development.
// - --pack     Also write the filtered mini-export to this tarball for instant re-import.
// - --no-import  Build the staged export only; skip the import step.
//
// Requires the Sanity CLI logged in with write access (`npx sanity login`).

import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'node:fs'

const TAGGER_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = resolve(TAGGER_DIR, '..', '..')

// The demo book the homepage embeds; must match `demoBookId` in apps/market/pages/index.tsx.
const DEMO_BOOK_ID = '3d007a9b-9b9a-4b3a-9530-97d06ba071ed'

function parseArgs(argv) {
  const args = { target: 'development', import: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--backup') args.backup = argv[++i]
    else if (a === '--target') args.target = argv[++i]
    else if (a === '--pack') args.pack = argv[++i]
    else if (a === '--no-import') args.import = false
    else throw new Error(`Unknown argument: ${a}`)
  }
  return args
}

function newestProductionBackup() {
  const matches = globSync('backups/sanity/production-*.tar.gz', { cwd: REPO_ROOT })
    .map((rel) => resolve(REPO_ROOT, rel))
    .sort()
  if (matches.length === 0) throw new Error('No backups/sanity/production-*.tar.gz found; pass --backup')
  return matches[matches.length - 1]
}

// tarball members are prefixed with a per-export dir, e.g. production-export-<ts>/data.ndjson
function exportBaseDir(tarball) {
  const first = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8', maxBuffer: 1 << 20 })
    .split('\n', 1)[0]
  return first.split('/')[0]
}

function refsIn(node, out = []) {
  if (Array.isArray(node)) node.forEach((v) => refsIn(v, out))
  else if (node && typeof node === 'object') {
    if (node._type === 'reference' && node._ref) out.push(node._ref)
    for (const v of Object.values(node)) refsIn(v, out)
  }
  return out
}

// Remove ebook file assets in place; collect image asset files to bundle.
function processAssets(node, images) {
  if (Array.isArray(node)) node.forEach((v) => processAssets(v, images))
  else if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const v = node[key]
      const sa = v && typeof v === 'object' ? v._sanityAsset : undefined
      if (typeof sa === 'string' && sa.startsWith('file@')) delete node[key]
      else processAssets(v, images)
    }
    const sa = node._sanityAsset
    if (typeof sa === 'string' && sa.startsWith('image@file://./')) images.add(sa.slice('image@file://./'.length))
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const backup = args.backup ? resolve(args.backup) : newestProductionBackup()
  const base = exportBaseDir(backup)
  console.log(`Backup:  ${backup}\nExport:  ${base}\nTarget:  ${args.target}`)

  const work = mkdtempSync(join(tmpdir(), 'seed-dev-'))
  const stage = join(work, 'export')
  mkdirSync(join(stage, 'images'), { recursive: true })

  // 1. Extract the full production data.ndjson (first member -> fast).
  execFileSync('tar', ['-xzf', backup, '-C', work, '-q', `${base}/data.ndjson`], { stdio: 'inherit' })
  const docs = new Map()
  for (const line of readFileSync(join(work, base, 'data.ndjson'), 'utf8').split('\n')) {
    if (line.trim()) { const d = JSON.parse(line); docs.set(d._id, d) }
  }

  // 2. Build the homepage document closure.
  const settings = [...docs.values()].filter((d) => d._type === 'pageSettings')
  if (settings.length !== 1) throw new Error(`Expected exactly 1 pageSettings, found ${settings.length}`)
  const collectionIds = refsIn(settings[0].featuredCollections)
  const bookIds = new Set([DEMO_BOOK_ID])
  for (const cid of collectionIds) {
    const c = docs.get(cid)
    if (!c) throw new Error(`Missing featured collection ${cid} in export`)
    for (const r of refsIn(c.members)) if (docs.get(r)?._type === 'book') bookIds.add(r)
  }
  const people = new Set()
  const publishers = new Set()
  for (const bid of bookIds) {
    const b = docs.get(bid)
    if (!b) throw new Error(`Missing book ${bid} in export`)
    refsIn(b.authors).forEach((r) => people.add(r))
    refsIn(b.publisher).forEach((r) => publishers.add(r))
  }
  const closure = [settings[0]._id, ...collectionIds, ...bookIds, ...people, ...publishers]
    .filter((id) => docs.has(id))

  // 3. Write filtered ndjson (ebook files stripped) and collect cover images to bundle.
  const images = new Set()
  const lines = []
  for (const id of closure) {
    const d = docs.get(id)
    processAssets(d, images)
    lines.push(JSON.stringify(d))
  }
  writeFileSync(join(stage, 'data.ndjson'), lines.join('\n') + '\n')
  console.log(`Closure: ${closure.length} docs, ${images.size} cover images`)

  // 4. Extract just the needed cover images (one sequential scan of the tarball).
  const members = join(work, 'images.txt')
  writeFileSync(members, [...images].map((rel) => `${base}/${rel}`).join('\n') + '\n')
  execFileSync('tar', ['-xzf', backup, '-C', stage, '--strip-components=1', '-T', members], { stdio: 'inherit' })

  // 5. Optionally pack a reusable seed tarball.
  if (args.pack) {
    const out = resolve(args.pack)
    execFileSync('tar', ['-czf', out, '-C', stage, 'data.ndjson', 'images'], { stdio: 'inherit' })
    console.log(`Packed seed: ${out}`)
  }

  // 6. Import into the target dataset (additive; never overwrites existing docs).
  if (args.import) {
    execFileSync(
      'npx',
      ['--no-install', 'sanity', 'dataset', 'import', stage, args.target, '--missing', '--allow-failing-assets'],
      { cwd: TAGGER_DIR, stdio: 'inherit' },
    )
  } else {
    console.log(`Staged export ready at ${stage} (import skipped)`)
  }

  if (args.import) rmSync(work, { recursive: true, force: true })
}

main()
