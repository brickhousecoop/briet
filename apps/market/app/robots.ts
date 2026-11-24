import type { MetadataRoute } from 'next'

// Demo deployments (DEMO_MODE=1) stay out of search engines entirely. The
// X-Robots-Tag header in next.config.mjs is the enforcement; this keeps
// well-behaved crawlers from probing at all.
export default function robots(): MetadataRoute.Robots {
  const demoMode = process.env.DEMO_MODE === '1' || process.env.DEMO_MODE === 'true'
  return demoMode
    ? { rules: { userAgent: '*', disallow: '/' } }
    : { rules: { userAgent: '*', allow: '/' } }
}
