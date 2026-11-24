import { SignUp } from '@clerk/nextjs'
import styles from '@styles/Home.module.css'

export default function Page() {
  return (
    <div className={styles.accountform}>
      <SignUp path='/account/sign-up' signInUrl='/account/sign-in' />
    </div>
  )
}