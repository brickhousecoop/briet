import type { MetadataRoute } from 'next'

// Demo deployments (DEMO_MODE) stay out of search engines entirely. The
// X-Robots-Tag header in next.config.mjs is the enforcement; this keeps
// well-behaved crawlers from probing at all.
export default function robots(): MetadataRoute.Robots {
  return process.env.DEMO_MODE
    ? { rules: { userAgent: '*', disallow: '/' } }
    : { rules: { userAgent: '*', allow: '/' } }
}
