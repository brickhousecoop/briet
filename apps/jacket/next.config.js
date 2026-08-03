/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return []
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }]
  },
}

module.exports = nextConfig
