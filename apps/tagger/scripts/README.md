# tagger scripts

## seed-dev-dataset.mjs — seed `development` with the market homepage's content

### The problem

market's homepage (`apps/market/pages/index.tsx`) renders a `pageSettings` singleton and
its `featuredCollections`, plus an embedded demo book. That content exists **only in the
`production` dataset**. Local dev and CI builds read the **`development`** dataset
(`NEXT_PUBLIC_SANITY_DATASET`), where the `pageSettings`/`collection` documents don't
exist — so `getStaticProps` dereferences `null` and `npm run build:market` fails on `/`
with `Cannot read properties of null (reading 'featuredCollections')`.

(`/catalog` survives because it only needs `book` documents, which do exist in
`development`. Disabling the Sanity CDN does **not** help — the docs are simply absent
from that dataset.)

### The fix

Copy just the homepage's document closure from a production export into `development`:

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
dangle harmlessly. Sanity asset ids are content-hash based and the export bundles the
original binaries, so cover references stay valid after upload.

### Usage

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

### Re-importing without a full backup

`--pack` writes a ~120 MB mini-export (664 docs + cover images) you can re-import directly:

```sh
cd apps/tagger
npx sanity dataset import ../../backups/sanity/seed-dev-homepage.tar.gz development \
  --missing --allow-failing-assets
```

### Is it safe? Does it merge?

Yes — the import is **additive**. `--missing` writes only these documents by `_id` and
**skips any that already exist** in `development` (it never overwrites editor changes), and
it never deletes anything. It is not a dataset copy/replace. In practice only a few shared
author records already exist; everything else (the `pageSettings`, collections, demo book,
covers) is new.
