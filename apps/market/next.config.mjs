/** @type {import('next').NextConfig} */

import { withBotId } from 'botid/next/config';

const nextConfig = {
  // Drives a footer badge so a demo audience can tell test charges from real
  // ones. It labels the build; it does not guard anything.
  env: {
    NEXT_PUBLIC_STRIPE_MODE: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'live',
  },
  async headers() {
    // Demo deployments (DEMO_MODE): strict noindex. The header covers every
    // route, including deep URLs a crawler may already know; app/robots.ts
    // keeps polite crawlers away on top of this.
    return process.env.DEMO_MODE
      ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
      : []
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
