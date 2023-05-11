import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import Fathom from '@/components/fathom'

import './globals.css'

export const metadata = {
  title: 'BRIET',
  description: 'Digital content, for libraries, for keeps.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Fathom />
        {children}
        <VercelAnalytics />
      </body>
    </html>
  )
}
