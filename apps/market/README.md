# `market` — BRIET Bookmarket

The public-facing marketplace at [market.briet.app](https://market.briet.app/), where libraries purchase ebooks. Next.js 16 + React 19, catalog content from Sanity, checkout via Stripe, auth via Clerk.

## Development

See the [root README](../../README.md) for full setup. Quick version:

1. `npm install` from the repo root
2. Copy `.env.example` to `.env.local` and fill in the Sanity vars (ask another developer, or `vc env pull` if you have Vercel access)
3. `npm run dev:local` (plain `next dev`)

`npm run dev` instead runs the full Vercel flow (`vercel link/pull/dev`), which requires membership in the Brick House Vercel team.
