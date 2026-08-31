import styles from '@styles/Home.module.css'
import Link from 'next/link'

const BrietFooter = () =>
  <footer className={styles.footer}>
    <Link href="/">An early <span className="logo">BRIET</span> prototype</Link>
    ¶
    <Link href="/about">About</Link>
    ¶
    <Link href="/terms-of-sale">Terms of Sale</Link>
    ¶
    <Link href="mailto:help@briet.app">Contact</Link>
    {process.env.NEXT_PUBLIC_STRIPE_MODE === 'test' && <><span>¶</span> <span>test mode</span></>}
  </footer>

BrietFooter.displayName = 'BrietFooter'

export default BrietFooter
