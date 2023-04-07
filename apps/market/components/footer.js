import styles from '@styles/Home.module.css'
import Link from 'next/link'

const BrietFooter = () =>
  <footer className={styles.footer}>
    <Link href="/">An early BRIET prototype</Link>
    ¶
    <Link href="/about">About</Link>
    ¶
    <Link href="mailto:help@briet.app">Contact</Link>
  </footer>

BrietFooter.displayName = 'BrietFooter'

export default BrietFooter
