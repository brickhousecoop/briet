export const metadata = {
  title: 'BRIET Bookmarket',
  description: 'Ebooks for libraries, for keeps.',
}

import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"

import {
  ClerkProvider,
  OrganizationSwitcher,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

import Link from 'next/link'
import Script from 'next/script'

import '@styles/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <Script
          src="https://cdn.usefathom.com/script.js"
          data-site={process.env.NEXT_PUBLIC_FATHOM_SITEID}
          strategy="afterInteractive"
        />
        <body>
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
          {children}
        </body>
        <VercelAnalytics />
        <SpeedInsights />
      </html>
    </ClerkProvider>
  )
}
