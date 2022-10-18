const opds = require('opds')
import { readOnlyClient as sanity } from 'sanity-client'

const catalog = require('../catalog.json')
console.log('catalogJSon', catalog)

function brietTaggerToOpds(taggerCatalog) {
  console.log(taggerCatalog)
  const processedFeed = taggerCatalog.map(book => {
    return {
      title: book.title,
      authors: book.authors,
      links: [
        {
          rel: "image",
          href: book.coverImg
        },
        {
          rel: "acquisition/buy",
          href: `https://market.briet.app/buy/${book._id}`,
          type: "application/pdf",
          price: {
            currencyCode: 'USD',
            value: book.price_usd
          }
        }
      ],
      isbn: book.isbn
    }
  })

  if (book.identifer_ia) {
    processedFeed.links.push({
      rel: "acquisition/borrow",
      href: `https://archive.org/details/${book.identifer_ia}`,
      type: "text/html"
    })
  }

  return processedFeed
}

const feed = {
  title: "BRIET Marketplace",
  author: {
    name: "The Brick House Cooperative",
    uri: "https://thebrick.house"
  },
}

const catalogQuery = `
  *[_type == "book"]{
    _id,
    title,
    isbn,
    identifer_ia,
    price_usd,
    authors[]->{ name },
    "coverImg": cover.asset -> url
  }
`

// exports XML as string
export default async () => {
  const taggerCatalog = await sanity.fetch(catalogQuery)

  feed.updated = new Date()
  feed.books = brietTaggerToOpds(taggerCatalog)

  // console.log('taggerCatalog feed', feed) //debug

  return opds.create(feed)
}
