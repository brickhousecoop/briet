import { ClerkProvider } from '@clerk/nextjs'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClerkProvider>{children}</ClerkProvider>
}
