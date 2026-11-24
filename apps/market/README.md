# `market` — BRIET Bookmarket

The public-facing marketplace at [market.briet.app](https://market.briet.app/), where libraries purchase ebooks. Next.js 16 + React 19, catalog content from Sanity, checkout via Stripe, auth via Clerk.

## Development

See the [root README](../../README.md) for full setup. Quick version:

1. `npm install` from the repo root
2. Copy `.env.example` to `.env.local` and fill in the Sanity vars (ask another developer, or `vc env pull` if you have Vercel access)
3. `npm run dev:local` (plain `next dev`)

`npm run dev` instead runs the full Vercel flow (`vercel link/pull/dev`), which requires membership in the Brick House Vercel team.

## Environment variables

Set values per deployment in Vercel, or in `.env.local` for local development.

- `NEXT_PUBLIC_SANITY_PROJECTID`: Sanity project containing the catalog.
- `NEXT_PUBLIC_SANITY_DATASET`: Sanity dataset to read and write (`development` or `production`).
- `SANITY_TOKEN`: Read-only Sanity token for catalog queries.
- `SANITY_WRITE_TOKEN`: Sanity Editor token for minting and spending redemption codes.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Public Clerk key for sign-in and account UI.
- `CLERK_SECRET_KEY`: Server Clerk key; must match the publishable key's instance.
- `STRIPE_SECRET_KEY`: Stripe key for checkout and orders; test keys for staging/demo, live for prod.
- `SITE_URL`: This deployment's origin, without a trailing slash, for Stripe return URLs.
- `DEMO_MODE`: `1` enables the demo badge and blocks indexing; leave unset in prod.
- `HIDE_UNPURCHASABLE_BOOKS`: `1` filters the catalog to free books with files or paid books with OLIDs and EPUBs.
- `NEXT_PUBLIC_FATHOM_SITEID`: Optional Fathom analytics site ID.

## Key Market Features

### Demo deployments

`DEMO_MODE` marks a deployment as a demo: `next.config.mjs` sends `X-Robots-Tag: noindex, nofollow` on every route and `app/robots.ts` disallows all crawlers, and the footer shows a "Demo Mode" badge so an audience can tell the demo from production. Checkout in demo deployments runs against Stripe in test mode (test keys, card 4242…), but the codes minted are real and redeemable, so a demo purchase exercises the exact fulfilment path above.

Purchase requires the buyer's primary email to be verified on their Clerk account: an unverified buyer is turned away before Stripe is reached and sent to `/account/settings` (Clerk's `<UserProfile>`), where an address can be added or verified. Verification also happens in Clerk's sign-up step. Clerk's [test mode](https://clerk.com/docs/guides/development/testing/test-emails-and-phones) avoids real inboxes: any `+clerk_test` address verifies instantly with code `424242`. Test mode is on by default on development instances (which localhost's `pk_test_` key is) and must be enabled in the Clerk Dashboard for production instances.

### Checkout

For a librarian purchasing a book:

1. **Click Purchase on `/buy/[id]`** and it triggers a plain form POST to `/api/checkout`, which creates a Stripe Checkout Session and redirects there. A redemption code is chosen up front and stashed in the Stripe session's metadata (with the book id) so it can appear in Stripe's receipt email. The code won't be valid for download yet.
2. **Pay on stripe.com, land back on `/order/[stripe-session-id]`** (Stripe's `success_url`). That page load is the fulfilment step: if the session is paid, it persists a `redeemCode` doc into Sanity keyed by session id (`redeem-<session id>`), so reloading shows the same code and concurrent loads can't mint two. One code redeems one copy, and quantity can't be adjusted at Stripe, so a buyer needing N copies checks out N times. If the payment hasn't cleared, the buyer sees "Order Pending" instead — there is no webhook yet (see TODO in `lib/redeemCode.ts`).
3. **Enter the code in Lenny.** [Lenny](https://github.com/ArchiveLabs/lenny) calls `/api/redeem-lenny/[code]`, which validates the code, imports the file, and marks the code spent. Codes are spent on first use.

Free books (`price_usd == 0`) skip Stripe entirely: the buy page links straight to `/order/free/[bookId]`, which serves the download with no code involved.

### Redeem endpoint contract (`/api/redeem-lenny/[code]`)

GET returns:

- **200** — `{ books: [{ olid, title, url }] }`; `olid` is the raw `identifier_ol` (`OL…M`), `url` is the direct Sanity CDN file URL. Books missing an olid or file are omitted, and the payload says nothing about how many copies the code redeems.
- **400** `{error: "already_redeemed"}` — code spent
- **404** `{error: "not_found"}` — no such code
- **422** `{error: "nothing_to_import"}` — every book lacks an olid or file (code *not* spent)
- **500** `{error: "claim_failed"}` — Sanity write failed

The 4xx/5xx split maps onto how Lenny's importer (ArchiveLabs/lenny#193) treats "invalid or spent" vs. "upstream unavailable".

### Order history (`/account`)

- Signed-in buyers can see their past orders at `/account` -- the site's only Clerk-gated area (`proxy.ts` protects just `/account/*`).
- Orders are matched by comparing the buyer's verified Clerk emails against the email given at Stripe checkout, so an old order surfaces by adding and verifying the address used then (verification is in Clerk, not in this app -- see [Demo deployments](#demo-deployments)).
- Nothing in the UI links to `/account` yet -- buyers only reach it by knowing the URL.
- The email match scans every Stripe session in the account (see `lib/accountOrders.ts`); a proper order index would come with the planned `checkout.session.completed` webhook.

This is the only part of market that writes to Sanity, so it needs `SANITY_WRITE_TOKEN` on top of the read-only `SANITY_TOKEN` -- see [read and write tokens are separate](../../README.md#read-and-write-tokens-are-separate). It also needs `SITE_URL`, because Stripe's return URLs are built from configuration rather than the request's `Origin` header, which could lead to a security issue.

A book is only importable if it has an Open Library edition id (`identifier_ol`) and a file; the endpoint returns 422 without spending the code otherwise. To mint a code by hand see `apps/tagger/scripts/README.md`.
