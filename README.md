# Getting Started

[BRIET](https://briet.app/) is a web-based platform that enables the permanent sale of ebooks and other digital works to libraries and institutions, thereby protecting traditional library rights. It’s a project of The Brick House Cooperative, a collective of independent publishers founded in 2020 with a mission to defend historic library rights and press freedom. It's named after the pioneering librarian [Suzanne Briet](https://en.wikipedia.org/wiki/Suzanne_Briet). We're also the cooperative team behind the [Flaming Hydra](https://flaminghydra.com/) newsletter.

This monorepo contains the code which runs our platforms (see below). We seek volunteer developers to help advance this work to strengthen “LEND LIKE PRINT” ebook practices. BRIET is built in open library catalog standards.

To get started, reach out [here on our webform](https://thebrick.house/briet/).

# Structure

BRIET is several interwoven applications. For librarians and institutions, the key point is the [Bookmarket](https://market.briet.app/), where approved customers can purchase ebooks, just like physical books. To be an approved customer, a library or institution must be a [public signatory](https://www.controlleddigitallending.org/) to the position statement on controlled digital lending (CDL).

On the tech side heading into 2026, our primary goal is to integrate e-commerce software into the Bookmarket so that approved customers can complete their own transactions. Please see the "help wanted" tag to get started.

## `binder`

**Publishers ⮕ BRIET Books**

A tool which takes in subscription-based newsletters, and converts to sellable digital books.

Most likely an external tool as we want to support WordPress, WordPress with Lede (Defector), Ghost (Hell Gate, Flaming Hydra), etc. RSS feeds of full-text HTML feel like the best common format.

_(not yet built, nor begun)_

## `tagger`

**BRIET Books ⮕ BRIET Catalog**

CMS to to manage the BRIET Catalog: metadata, prices, and asset files for digital books and other digital items. Built on Sanity, user access managed by BRIET staff.

In production at **tagger.briet.app**

### `tagger` Development

You'll need
- a [Sanity account](https://www.sanity.io/login/sign-up)
- to be invited (at Developer role or higher) to [BRIET's Sanity Project](https://www.sanity.io/organizations/oeYsaoziG/project/3lm68n5v).
- nodejs 20 (see below)

You need to be pretty strict about node@20 (latest stable version is fine)— versions 21+ are known to have issues with the dependencies of this app. This is configured in `./apps/tagger/.tool-versions` for `mise` or similar tools to pick up.

`cd apps/tagger`

`mise install` (or another way to ensure you are on `node` version 20, see above)

`npm install` (you can safely ignore `Unsupported engine` warnings, they are related to `server`)

`npx sanity@latest login`, log into your Sanity account

`vc dev` to link with Vercel first time, pull env vars, & run

or `npm run dev` if you just want to tinker locally, but you will need probably some env vars from another developer (try Jacob)

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

`vc link --scope brickhousecoop --project bh-briet-market` to link with Vercel and pull env vars

`vc dev`

or `npm run dev` if you just want to tinker locally, but you will need probably some env vars from another developer (try Jacob)

## `lender` (Lenny)

**Library Books ⮕ Library Patrons**

Not in this repo, nor on Vercel. Deployed to a DigitalOcean box pointed to by lender.briet.app.

Reach out to Jacob/David/Maria for an `/admin` login.

Upstream repo is https://github.com/archiveLabs/lenny

Our fork is https://github.com/brickhousecoop/lenny

# BRIET Styleguide

## How to spell “ebook”

It is spelled `ebook` or `ebooks`. Not `e-book`, `eBook`, or `e-Book`. Ebook should be capititalized only when you would normally capitalize a word.

## On the etymological difference between _lending_ and _loaning_

Don't know don't care, but we use **loan**. BRIET _sells_ books to libraries, that they may be freely _loaned_ to patrons.
