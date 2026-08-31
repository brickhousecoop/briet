# `market` — BRIET Bookmarket

The public-facing marketplace at [market.briet.app](https://market.briet.app/), where libraries purchase ebooks. Next.js 16 + React 19, catalog content from Sanity, checkout via Stripe, auth via Clerk.

## Development

See the [root README](../../README.md) for full setup. Quick version:

1. `npm install` from the repo root
2. Copy `.env.example` to `.env.local` and fill in the Sanity vars (ask another developer, or `vc env pull` if you have Vercel access)
3. `npm run dev:local` (plain `next dev`)

`npm run dev` instead runs the full Vercel flow (`vercel link/pull/dev`), which requires membership in the Brick House Vercel team.

## Key Market Features

### Demo deployments

`DEMO_MODE` marks a deployment as a demo: `next.config.mjs` sends `X-Robots-Tag: noindex, nofollow` on every route and `app/robots.ts` disallows all crawlers. Checkout in demo deployments runs against Stripe in test mode (test keys, card 4242…), and whenever `NEXT_PUBLIC_STRIPE_MODE=test` the footer shows a "test mode" badge so an audience can tell test charges from real ones — but the codes minted are real and redeemable, so a demo purchase exercises the exact fulfilment path above.

### Checkout

For a librarian purchasing a book:

1. **Click Purchase on `/buy/[id]`** and it triggers a plain form POST to `/api/checkout`, which creates a Stripe Checkout Session and redirects there. A redemption code is chosen up front and stashed in the Stripe session's metadata (with the book id) so it can appear in Stripe's receipt email. The code won't be valid for download yet.
2. **Pay on stripe.com, land back on `/order/[stripe-session-id]`** (Stripe's `success_url`). That page load is the fulfilment step: if the session is paid, it persists a `redeemCode` doc into Sanity keyed by session id (`redeem-<session id>`), so reloading shows the same code and concurrent loads can't mint two. Codes are chosen per-copy but minted once per session: a multi-copy purchase yields one code that redeems that many copies. If the payment hasn't cleared, the buyer sees "Order Pending" instead — there is no webhook yet (see TODO in `lib/redeemCode.ts`).
3. **Enter the code in Lenny.** [Lenny](https://github.com/ArchiveLabs/lenny) calls `/api/redeem-lenny/[code]`, which validates the code, imports the file, and marks the code spent. Codes are spent on first use.

Free books (`price_usd == 0`) skip Stripe entirely: the buy page links straight to `/order/free/[bookId]`, which serves the download with no code involved.

### Order history (`/account`)

- Signed-in buyers can see their past orders at `/account` -- the site's only Clerk-gated area (`proxy.ts` protects just `/account/*`).
- Orders are matched by comparing the buyer's verified Clerk emails against the email given at Stripe checkout, so an old order surfaces by adding the address used then.
- Nothing in the UI links to `/account` yet -- buyers only reach it by knowing the URL.
- The email match scans every Stripe session in the account (see `lib/accountOrders.ts`); a proper order index would come with the planned `checkout.session.completed` webhook.

This is the only part of market that writes to Sanity, so it needs `SANITY_WRITE_TOKEN` on top of the read-only `SANITY_TOKEN` -- see [read and write tokens are separate](../../README.md#read-and-write-tokens-are-separate). It also needs `SITE_URL`, because Stripe's return URLs are built from configuration rather than the request's `Origin` header, which could lead to a security issue.

A book is only importable if it has an Open Library edition id (`identifier_ol`) and a file; the endpoint returns 422 without spending the code otherwise. To mint a code by hand see `apps/tagger/scripts/README.md`.
