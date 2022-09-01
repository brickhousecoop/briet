const opds = require('opds')
const sanityClient = require('@sanity/client')
const client = sanityClient({
  projectId: process.env.SANITY_PROJECTID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2022-08-21', // known good UTC date https://www.sanity.io/docs/api-versioning#228b7a6a8148
  token: process.env.SANITY_TOKEN, // or leave blank for unauthenticated usage
  useCdn: false, // `false` if you want to ensure fresh data
})

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
    price_usd,
    authors[]->{ name },
    "coverImg": cover.asset -> url
  }
`

// exports XML as string
export default async () => {
  const taggerCatalog = await client.fetch(catalogQuery)

  feed.updated = new Date()
  feed.books = brietTaggerToOpds(taggerCatalog)

  // console.log('taggerCatalog feed', feed) //debug

  return opds.create(feed)
}
