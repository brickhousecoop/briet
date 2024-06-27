import type { AppProps } from 'next/app'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"

import '@styles/globals.css'
import Script, { ScriptProps } from 'next/script'

function App({ Component, pageProps }: AppProps) {
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
}

export default App
