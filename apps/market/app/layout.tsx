import { Analytics as VercelAnalytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'

import '@styles/globals.css'

export const metadata = {
  title: 'BRIET Bookmarket',
  description: 'Ebooks for libraries, for keeps.',
}

// The template shell for app/ routes; pages/_app.tsx is the template for pages/.
// Changes to one for e.g. analytics scripts or styles should probably also be made
// in the other.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://cdn.usefathom.com/script.js"
          data-site={process.env.NEXT_PUBLIC_FATHOM_SITEID}
          strategy="afterInteractive"
        />
        {children}
        <VercelAnalytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
