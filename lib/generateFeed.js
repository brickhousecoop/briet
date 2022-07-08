const opds = require('opds')
const books = require('../catalog')

const feed = {
  "title": "BRIET Marketplace",
  "author": {
    "name": "The Brick House Cooperative",
    "uri": "https://thebrick.house"
  },
  "books": books
}

// exports XML as string
export default opds.create(feed)
