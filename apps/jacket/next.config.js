/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/about',
        destination: 'https://market.briet.app/about',
        permanent: true,
      }
    ]
  },
}

module.exports = nextConfig
