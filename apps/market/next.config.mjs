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
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
}

export default withBotId(nextConfig)
