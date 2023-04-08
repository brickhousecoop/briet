import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import FathomAnalytics from 'components/fathom'

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
        <FathomAnalytics />
        {children}
        <VercelAnalytics />
      </body>
    </html>
  )
}
