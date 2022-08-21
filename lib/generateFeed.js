const opds = require('opds')
const sanityClient = require('@sanity/client')
const client = sanityClient({
  projectId: process.env.SANITY_PROJECTID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2022-08-21', // known good UTC date https://www.sanity.io/docs/api-versioning#228b7a6a8148
  token: process.env.SANITY_TOKEN, // or leave blank for unauthenticated usage
  useCdn: true, // `false` if you want to ensure fresh data
})

const feed = {
  title: "BRIET Marketplace",
  author: {
    name: "The Brick House Cooperative",
    uri: "https://thebrick.house"
  }
}

// exports XML as string
export default async () => {
  feed.updated = new Date()
  feed.books = await client.fetch('*[_type == "book"] {title, isbn}')

  return opds.create(feed).default
}
