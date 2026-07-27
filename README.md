# Getting Started

[BRIET](https://briet.app/) is a web-based platform that enables the permanent sale of ebooks and other digital works to libraries and institutions, thereby protecting traditional library rights. It’s a project of The Brick House Cooperative, a collective of independent publishers founded in 2020 with a mission to defend historic library rights and press freedom. It's named after the pioneering librarian [Suzanne Briet](https://en.wikipedia.org/wiki/Suzanne_Briet). We're also the cooperative team behind the [Flaming Hydra](https://flaminghydra.com/) newsletter.

This monorepo contains the code which runs our platforms (see below). We seek volunteer developers to help advance this work to strengthen “LEND LIKE PRINT” ebook practices. BRIET is built in open library catalog standards.

To get started, reach out [here on our webform](https://thebrick.house/briet/).

# Local Development

Every app has two dev scripts. `dev:local` runs the app's own dev server (`next dev`, `sanity dev`, `http-server`) and is what you want almost always. `dev` runs the app through `vercel dev`, which is slower, needs Vercel auth, and — per [Vercel's own guidance](https://vercel.com/docs/cli/dev) — buys you nothing for a framework app, since `next dev` already handles functions, redirects, rewrites, headers, and middleware natively.

## Bootstrap a fresh checkout

**1. Node 24.** Pinned in `.tool-versions` and `.nvmrc`, so `mise install`, `asdf install`, or `nvm use` all pick it up.

**2. Install from the repo root.** This is an npm workspace — one install covers every app. Installing inside an app directory instead will produce a broken tree.

```
npm install
```

`Unsupported engine` warnings come from `server` and are safe to ignore.

**3. Log into Sanity.** Required for `tagger`; also how your access to catalog content is granted.

```
npx sanity login
```

**4. Set up env vars.** Env vars are **per app**, not shared — each app is its own Vercel project with its own variables, and each reads its own `apps/<app>/.env.local`. That file is gitignored, so a fresh checkout has none.

| App | Needs env vars? |
|---|---|
| jacket | yes — copy `.env.example`; its committed defaults work as-is |
| market | yes — see `apps/market/.env.example` |
| tagger | no — `.env.development` is committed and carries the non-secret project ID |
| reader | no — fully static |

Market's Stripe and Clerk keys only matter for the checkout and `/account` flows; without them the catalog still browses fine.

Two ways to get values:

**On the Brick House Vercel team** — pull them. Log in once, then link and pull in each app that needs it:

```
npx vercel login
cd apps/market
npx vercel link --scope brickhousecoop --project bh-briet-market
npx vercel env pull
```

`vercel link` is one-time setup per app directory — it writes `.vercel/project.json`, just an org ID and project ID so later commands know which project you mean. `vercel env pull` writes `.env.local` from the project's Development variables, and **overwrites** the file rather than merging. Re-run it when vars change; you never need to re-run `link`. Projects are named `bh-briet-<app>`.

**Not on the team** — copy `apps/market/.env.example` to `.env.local` and ask a developer for the blank values.

## Run one app

From the repo root:

```
npm run dev:local -w apps/jacket
```

Or equivalently `cd apps/jacket && npm run dev:local`.

## Run all apps

From the repo root:

```
npm run dev:local
```

Runs every app's `dev:local` in parallel via turbo. Ports are pinned, so the URLs are stable:

| App | URL |
|---|---|
| jacket | http://localhost:3000 |
| market | http://localhost:3001 |
| tagger | http://localhost:3333 |
| reader | http://localhost:8080 |

`server` has no dev script and is skipped (see its section below).

# Structure

BRIET is several interwoven applications. For librarians and institutions, the key point is the [Bookmarket](https://market.briet.app/), where approved customers can purchase ebooks, just like physical books. To be an approved customer, a library or institution must be a [public signatory](https://www.controlleddigitallending.org/) to the position statement on controlled digital lending (CDL).

On the tech side heading into 2026, our primary goal is to integrate e-commerce software into the Bookmarket so that approved customers can complete their own transactions. Please see the "help wanted" tag to get started.

## `binder`

**Publishers ⮕ BRIET Books**

A tool which takes in subscription-based newsletters, and converts to sellable digital books.

Most likely an external tool as we want to support WordPress, WordPress with Lede (Defector), Ghost (Hell Gate, Flaming Hydra), etc. RSS feeds of full-text HTML feel like the best common format.

_(not yet built, nor begun)_

## `jacket`

**The BRIET homepage**

A small Next.js site serving [briet.app](https://briet.app/), with content from the BRIET Catalog (Sanity).

### `jacket` Development

`npm install` from the repo root, then copy `apps/jacket/.env.example` to `.env.local` — the committed defaults are enough to build and run, since the Sanity project ID is public and the `test` dataset needs no token. `npm run dev:local` then runs `next dev` on port 3000.

**With Vercel:** `npm run dev` runs the app through `vercel dev` (project `bh-briet-jacket`), and `vercel env pull` gets you the real token if you need authenticated content.

## `tagger`

**BRIET Books ⮕ BRIET Catalog**

CMS to manage the BRIET Catalog: metadata, prices, and asset files for digital books and other digital items. Built on Sanity, user access managed by BRIET staff.

In production at **tagger.briet.app**

### `tagger` Development

You'll need
- a [Sanity account](https://www.sanity.io/login/sign-up)
- to be invited (at Developer role or higher) to [BRIET's Sanity Project](https://www.sanity.io/organizations/oeYsaoziG/project/3lm68n5v).
- nodejs 24 (see below)

We target the current Node LTS (24), pinned in `.tool-versions`/`.nvmrc` for `mise`, `asdf`, or `nvm` to pick up. Sanity requires Node ≥20.19, so any recent LTS works; 24 gives the longest support runway.

`cd apps/tagger`

`mise install` (or another way to ensure you are on `node` version 24, see above)

`npm install` (you can safely ignore `Unsupported engine` warnings, they are related to `server`)

`npx sanity@latest login`, log into your Sanity account

`npm run dev:local` runs `sanity dev` on port 3333. No env vars needed — `.env.development` is committed and carries the non-secret project ID, and your access comes from `sanity login`.

**With Vercel:** `npm run dev` runs the app through `vercel dev` instead. Rarely useful here, since Sanity Studio's own dev server is what production builds from anyway.

## `server`

**BRIET Catalog ⮕ Libraries (listing)**

Serves an OPDS BookServer feed (specifically, an [ODL feed](https://drafts.opds.io/odl-1.0)) of the entire BRIET Catalog, for ingestion into other library catalogs.

In production at **server.briet.app** (warning: raw OPDS feed).

### `server` Development

> [!WARNING]
> Relies on some very deprecated npm packages, and hasn't been touched in a long time.

From Jacob, May 2026: just realized npm build/start scripts are broken here, so I'm going to skip documenting. Reach out if you need to work on `server`.

## `market`

**BRIET Books ⮕ Libraries (purchasing)**

The public-facing BRIET Marketplace, where libraries can purchase books.

This is a NextJS app, hewing very closely to its default out-of-the-box template for the path of least resistance.

Stripe handles the checkout & payment flow, and we invented the hacky solution of using Stripe's fraud flagging feature, to allow David to manually review purchases on our end before cards are charged (we have a flow defined which holds all transactions for manual review). David then fulfills orders manually, emailing the user their files directly (which he grabs from Tagger).

However automatic download fulfillment is a great next feature to tackle, dear reader: https://github.com/brickhousecoop/briet/issues/86

### `market` Development

You'll need
- to be added to Brick House's Vercel team, for ENV vars
- to be added as developer to Brick House's Stripe account, if you are working on checkout flow
- to be added as developer to BRIET's Clerk account, if you are working on user auth (including checkout)

`cd apps/market`

`npm install` (you can safely ignore `Unsupported engine` warnings, they are related to `server`)

Get env vars into `apps/market/.env.local`, either by pulling them:

```
npx vercel link --scope brickhousecoop --project bh-briet-market
npx vercel env pull
```

or, if you're not on the Vercel team, by copying `.env.example` to `.env.local` and asking a developer for the values. Only the Sanity vars are needed to browse the catalog — Stripe matters for checkout, Clerk for the `/account` flow.

`npm run dev:local` runs `next dev` on port 3001.

**With Vercel:** `npm run dev` runs the app through `vercel dev`. Slower and needs auth; `next dev` already handles rewrites, headers, and the Clerk proxy natively.

## `reader`

**In-browser ebook reading**

A static build of the Internet Archive [BookReader](https://github.com/internetarchive/bookreader), served by `http-server` — run `npm run dev:local` in `apps/reader`. It ships a landing page plus one pre-baked demo book (static page JPEGs under `public/borrow/`), which market's homepage embeds in an iframe.

There is no page-rendering backend: the old PDF→JPG edge function (`api/getPage`) and its native deps were removed, so `reader` is now purely static. A real book-serving pipeline for non-PDF books still needs to be built.

## `lender` (Lenny)

**Library Books ⮕ Library Patrons**

Not in this repo, nor on Vercel. Deployed to a DigitalOcean box pointed to by lender.briet.app.

Reach out to Jacob/David/Maria for an `/admin` login.

Upstream repo is https://github.com/archiveLabs/lenny

Our fork is https://github.com/brickhousecoop/lenny

# BRIET Styleguide

## How to spell “ebook”

It is spelled `ebook` or `ebooks`. Not `e-book`, `eBook`, or `e-Book`. Ebook should be capitalized only when you would normally capitalize a word.

## On the etymological difference between _lending_ and _loaning_

Don't know don't care, but we use **loan**. BRIET _sells_ books to libraries, that they may be freely _loaned_ to patrons.
