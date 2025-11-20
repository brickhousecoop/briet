/** @type {import('next').NextConfig} */

import { withBotId } from 'botid/next/config';

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/about',
        destination: 'https://briet.app/about',
        permanent: true,
      }
    ]
  },
  reactStrictMode: true,
  swcMinify: false,
  images: {
    domains: [
      'cdn.sanity.io'
    ]
  },
}

module.exports = withBotId(nextConfig)
