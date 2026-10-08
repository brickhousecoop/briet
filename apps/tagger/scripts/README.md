# tagger scripts

## seed-dev-dataset.mjs — seed `development` with the market homepage's content

The `development` dataset has no homepage content, so without this seed the
market homepage renders empty. This script copies just the homepage's document
closure from a production export:

```
pageSettings (singleton)
  └─ featuredCollections[] → collection
        └─ members[] → book
              ├─ authors[] → author
              └─ publisher → publisher
+ the demo book (DEMO_BOOK_ID, must match apps/market/pages/index.tsx)
+ each book's cover image binary
```

Ebook `file` assets (multi-GB, unused by the homepage) are dropped; their references
dangle harmlessly. Cover references stay valid because Sanity asset ids are
content-hash based and the export bundles the original binaries.

The import is **additive**: `--missing` writes only documents that don't already
exist in `development`, so editor changes are never overwritten and nothing is
deleted. In practice only a few shared author records already exist.

Requires the Sanity CLI logged in with write access (`npx sanity login`).

```sh
# From the repo root. Uses the newest backups/sanity/production-*.tar.gz by default.
node apps/tagger/scripts/seed-dev-dataset.mjs

# Explicit backup, and also write a reusable mini-export tarball:
node apps/tagger/scripts/seed-dev-dataset.mjs \
  --backup backups/sanity/production-20260720-164529.tar.gz \
  --pack   backups/sanity/seed-dev-homepage.tar.gz
```

Options: `--backup <tarball>`, `--target <dataset>` (default `development`),
`--pack <tarball>`, `--no-import` (stage only).

`--pack` writes a ~120 MB mini-export (664 docs + cover images) you can re-import
directly:

```sh
cd apps/tagger
npx sanity dataset import ../../backups/sanity/seed-dev-homepage.tar.gz development \
  --missing --allow-failing-assets
```

## create-redeem-code.mjs — mint a Lenny redeem code by hand

For the cases that have no checkout behind them: a spare code to carry into a
demo, or fulfilling an order placed before the book was tagged.

```sh
SANITY_PROJECTID=… SANITY_DATASET=production SANITY_WRITE_TOKEN=… \
node apps/tagger/scripts/create-redeem-code.mjs --books <bookId> [<bookId> …] \
  [--code CODE] [--session STRIPE_SESSION_ID] [--note "for the Everytown demo"]
```

The token must have write access: `SANITY_WRITE_TOKEN` if set, else `SANITY_TOKEN` —
a read-only one (jacket's `SANITY_TOKEN`) passes the book checks and fails at the
write with a named 403. Sourcing an app's `.env.local` covers the project id and
dataset: the script also accepts `SANITY_STUDIO_*` and `NEXT_PUBLIC_SANITY_*`.
Book ids are Sanity document `_id`s.

The script refuses any book without an Open Library **edition** id (`identifier_ol`, e.g.
`OL32941311M`) or a file, because Lenny cannot import one: it parses the OLID and rejects
anything that fails an EPUB check. Codes are one-shot and `redeemedAt` is read-only in
the Studio, so a burned code cannot be reset from the UI — mint a spare rather than
planning to recover one.

Mint into the same dataset the redeeming market deployment reads. Lenny hardcodes
`https://market.briet.app/api/redeem-lenny`, which serves `production`.
