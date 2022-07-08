const feed = require('../lib/generateFeed')

export default (req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/xml')

  // Instructing the Vercel edge to cache the file
  res.setHeader('Cache-control', 'stale-while-revalidate, s-maxage=3600')

  console.log(feed)

  res.end(feed.default)
}
