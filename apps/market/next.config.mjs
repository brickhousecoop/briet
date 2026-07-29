/** @type {import('next').NextConfig} */

import { withBotId } from 'botid/next/config';

const nextConfig = {
  // Drives a footer badge so a demo audience can tell test charges from real
  // ones. It labels the build; it does not guard anything.
  env: {
    NEXT_PUBLIC_STRIPE_MODE: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'live',
  },
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
