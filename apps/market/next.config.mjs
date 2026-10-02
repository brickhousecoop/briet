/** @type {import('next').NextConfig} */

import { withBotId } from 'botid/next/config';

const nextConfig = {
  env: {
    // Public projection of DEMO_MODE for client bundles (footer badge).
    // Server-side gating (noindex headers, robots.txt) reads DEMO_MODE directly.
    NEXT_PUBLIC_DEMO_MODE: process.env.DEMO_MODE ? '1' : '',
  },
  // Demo deployments (DEMO_MODE): without this, Next's automatic trailing-slash
  // and // normalization 308s go out with no X-Robots-Tag (headers() below does
  // not apply to them). With it they 404 instead, header included. Prod keeps
  // its current redirects.
  skipTrailingSlashRedirect: !!process.env.DEMO_MODE,
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
