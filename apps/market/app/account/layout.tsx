import { ClerkProvider } from '@clerk/nextjs'

// The account area is per-user and Clerk-gated; static prerendering is pointless
// and would force a build-time dependency on Clerk keys.
export const dynamic = 'force-dynamic'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClerkProvider>{children}</ClerkProvider>
}
