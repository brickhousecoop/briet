/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return []
  },
  images: {
    domains: ['cdn.sanity.io']
  },
}

module.exports = nextConfig
