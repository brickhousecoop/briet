export const metadata = {
  title: 'BRIET Marketplace',
  description: 'Ebooks for libraries, for keeps.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
