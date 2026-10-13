import { ClerkProvider } from '@clerk/nextjs'
import Footer from '@components/footer'
import styles from '@styles/Home.module.css'

// The account area is per-user and Clerk-gated; static prerendering is pointless
// and would force a build-time dependency on Clerk keys.
export const dynamic = 'force-dynamic'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>
            <span className="logo">BRIET</span>Marketplace
          </h1>
          {children}
        </main>
      </div>
      <Footer />
    </ClerkProvider>
  )
}