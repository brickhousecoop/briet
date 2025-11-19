# Getting Started

[BRIET](https://briet.app/) is a web-based platform that enables the permanent sale of ebooks and other digital works to libraries and institutions, thereby protecting traditional library rights. It’s a project of The Brick House Cooperative, a collective of independent publishers founded in 2020 with a mission to defend historic library rights and press freedom. It's named after the pioneering librarian [Suzanne Briet](https://en.wikipedia.org/wiki/Suzanne_Briet). We're also the cooperative team behind the [Flaming Hydra](https://flaminghydra.com/) newsletter.

This monorepo contains the code which runs our platforms (see below). We seek volunteer developers to help advance this work to strengthen “LEND LIKE PRINT” ebook practices. BRIET is built in open library catalog standards.

To get started, reach out [here on our webform](https://thebrick.house/briet/).

# Structure

BRIET is several interwoven applications. For librarians and institutions, the key point is the [Bookmarket](https://market.briet.app/), where approved customers can purchase ebooks, just like physical books. To be an approved customer, a library or institution must be a [public signatory](https://www.controlleddigitallending.org/) to the position statement on controlled digital lending (CDL).

On the tech side heading into 2026, our primary goal is to integrate e-commerce software into the Bookmarket so that approved customers can complete their own transactions. Please see the "help wanted" tag to get started.

## `binder`

**Text content ⮕ PDF/EPUB**

WordPress plugin, other CMSs to come

_(not yet in scope)_

## `tagger`

**PDF/EPUB ⮕ Bibligraphic Record**

CMS for creators to prep, tag, and bundle their book strict metadata for library cataloging systems

## `server`

**Bibliographic Records ⮕ BookServer Feed**

Ingests a `tagger` book collection with bibligraphic information and returns an OPDS BookServer feed (specifically, an [ODL feed](https://drafts.opds.io/odl-1.0))

## `market`

**BookServer Feed ⮕ Librarian Bookmarket**

Ingests an ODL/OPDS BookServer feed and returns a librarian-friendly marketplace website for local libraries to purchase and lend digital books the [exact same way](https://controlleddigitallending.org) they have with old fashioned wooden books for centuries

_(not yet scoped)_

# BRIET Styleguide

## How to spell “ebook”

It is spelled `ebook` or `ebooks`. Not `e-book`, `eBook`, or `e-Book`. Ebook should be capititalized only when you would normally capitalize a word.

## On the etymological difference between _lending_ and _loaning_

Don't know don't care, but we use **loan**. BRIET _sells_ books to libraries, that they may be freely _loaned_ to patrons.
