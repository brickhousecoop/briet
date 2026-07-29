# `market` — BRIET Bookmarket

The public-facing marketplace at [market.briet.app](https://market.briet.app/), where libraries purchase ebooks. Next.js 16 + React 19, catalog content from Sanity, checkout via Stripe, auth via Clerk.

## Development

See the [root README](../../README.md) for full setup. Quick version:

1. `npm install` from the repo root
2. Copy `.env.example` to `.env.local` and fill in the Sanity vars (ask another developer, or `vc env pull` if you have Vercel access)
3. `npm run dev:local` (plain `next dev`)

`npm run dev` instead runs the full Vercel flow (`vercel link/pull/dev`), which requires membership in the Brick House Vercel team.

### Selling a book end to end

Checkout puts the book id in the Stripe session's metadata; the order page reads it back and mints a one-time redemption code into Sanity; the librarian enters that code in [Lenny](https://github.com/ArchiveLabs/lenny), which calls `/api/redeem-lenny/[code]` and imports the file. Codes are spent on first use.

This is the only part of market that writes to Sanity, so it needs `SANITY_WRITE_TOKEN` on top of the read-only `SANITY_TOKEN` — see [read and write tokens are separate](../../README.md#read-and-write-tokens-are-separate). It also needs `SITE_URL`, because Stripe's return URLs are built from configuration rather than the request's `Origin` header, which a caller controls.

A book is only importable if it has an Open Library edition id (`identifer_ol`) and a file; the endpoint returns 422 without spending the code otherwise. To mint a code by hand — a demo spare, or an order placed before the book was tagged — see `apps/tagger/scripts/README.md`.
