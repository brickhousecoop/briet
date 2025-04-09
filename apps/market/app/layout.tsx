export const metadata = {
  title: 'BRIET Bookmarket',
  description: 'Ebooks for libraries, for keeps.',
}

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  OrganizationProfile,
} from '@clerk/nextjs'

import '@styles/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
            <OrganizationProfile />
          </SignedIn>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
