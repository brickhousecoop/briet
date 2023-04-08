import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from './page.module.css'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>
          Digital books, for libraries, <strong>for keeps</strong>.
        </p>
        <div>
          <a
            href="https://thebrick.house"
            target="_blank"
          >
            From{' '}
            <Image
              src="/brickhouse_logo.svg"
              alt="Vercel Logo"
              className={styles.vercelLogo}
              width={150}
              height={24}
              priority
            />
          </a>
        </div>
      </div>

      <div className={styles.center}>
        <Image
          className={styles.logo}
          src="/briet_logo.svg"
          alt="BRIET Logo"
          width={300}
          height={100}
          priority
        />
      </div>

      <h2 className={inter.className}>BRIET is three interwoven applications:</h2>

      <div className={styles.grid}>
        <a
          href="https://tagger.briet.app"
          className={styles.card}
        >
          <h2 className={inter.className}>
            Tagger <span>-&gt;</span>
          </h2>
          <p className={inter.className}>
            Authors upload and tag their e-books with library-friendly metadata
          </p>
        </a>

        <a
          href="https://server.briet.app"
          className={styles.card}
        >
          <h2 className={inter.className}>
            Server <span>-&gt;</span>
          </h2>
          <p className={inter.className}>
            We serve an open searchable feed of books, powered by BookServer
          </p>
        </a>

        <a
          href="https://market.briet.app"
          className={styles.card}
        >
          <h2 className={inter.className}>
            Market <span>-&gt;</span>
          </h2>
          <p className={inter.className}>
            Librarians browse for e-books and easily add them to their catalog
          </p>
        </a>
      </div>
    </main>
  )
}
