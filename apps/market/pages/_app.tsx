import type { AppProps } from 'next/app'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"

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
      <ClerkProvider {...pageProps}>
        <SignedOut>
          <SignInButton />
          <SignUpButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <Component {...pageProps} />
      </ClerkProvider>
      <VercelAnalytics />
      <SpeedInsights />
    </>
  )
}

export default App
