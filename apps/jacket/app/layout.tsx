import { Analytics as VercelAnalytics } from '@vercel/analytics/react'

import './globals.css'

export const metadata = {
  title: 'BRIET',
  description: 'Digital content for sale, by creators, to libraries, for ever.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <VercelAnalytics />
      </body>
    </html>
  )
}
