import type { AppProps } from 'next/app'
import Link from 'next/link'
import {
  ClerkProvider,
  OrganizationSwitcher,
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
        <header style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.5rem 1rem' }}>
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/account/orders" />
            <Link href="/account/orders">Orders</Link>
            <Link href="/account/library">Library</Link>
            <UserButton />
          </SignedIn>
        </header>
        <Component {...pageProps} />
      </ClerkProvider>
      <VercelAnalytics />
      <SpeedInsights />
    </>
  )
}

export default App
