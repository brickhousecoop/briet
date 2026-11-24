import Link from 'next/link'
import { UserProfile } from '@clerk/nextjs'
import styles from '@styles/Home.module.css'

export const metadata = { title: 'BRIET Bookmarket: Account Settings' }

export default async function Page({ searchParams }: { searchParams: Promise<{ verify?: string }> }) {
  const { verify } = await searchParams

  return (
    <>
      {verify === 'email' && (
        <p className={styles.instructions}>
          Verify your email address to purchase. Add or verify one below, then return to the book.
          Once verified, <Link href="/">return to the Bookmarket</Link>.
        </p>
      )}
      <UserProfile path='/account/settings' />
    </>
  )
}