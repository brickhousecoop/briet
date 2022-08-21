import generateFeed from '../lib/generateFeed'

export default async (req, res) => {
  const feed = await generateFeed
  console.log('serveFeed feed', feed)

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/xml')

  // Instructing the Vercel edge to cache the file
  res.setHeader('Cache-control', 'stale-while-revalidate, s-maxage=3600')

  res.end(feed)
}
