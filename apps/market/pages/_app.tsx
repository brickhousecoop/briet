import type { AppProps } from 'next/app'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'

import '@styles/globals.css'
import Script from 'next/script'

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
    </>
  )
}

export default App
