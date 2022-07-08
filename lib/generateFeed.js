const opds = require('opds')
const books = require('../catalog')

const feed = {
  title: "BRIET Marketplace",
  author: {
    name: "The Brick House Cooperative",
    uri: "https://thebrick.house"
  },
  updated: new Date(),
  "books": books
}

// exports XML as string
export default opds.create(feed)
