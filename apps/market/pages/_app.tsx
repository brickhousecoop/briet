import type { AppProps } from 'next/app'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"

import '@styles/globals.css'
import Script from 'next/script'

// The template shell for pages/ routes only; app/layout.tsx is the counterpart for app/.
// Changes here should probably be made there too
function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        src="https://cdn.usefathom.com/script.js"
        data-site={process.env.NEXT_PUBLIC_FATHOM_SITEID}
        strategy="afterInteractive"
      />
      <Component {...pageProps} />
      <VercelAnalytics />
      <SpeedInsights />
    </>
  )
}

export default App
