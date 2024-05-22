import Head from '@components/head.jsx'
import Link from 'next/link'
import Footer from '@components/footer'
import styles from '@styles/Home.module.css'

const BrietAboutPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>BRIET Marketplace</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <span className="logo">BRIET</span> Terms of Sale
        </h1>

        <h2>TL;DR</h2>
        <p>BRIET sells ebooks like print books. Buying an ebook from us means it’s really yours and you can use it exactly how you use a physical book that you own. We trust our library partners to purchase the number of copies they need to serve their community.</p>

        <h2>Legal Jargon</h2>
        <p>Briet hereby sells authorized digital copies (“ADC”) of the eBooks [Listed in Schedule 1] to [Name of Library] (“Library”). The sale transfers title in the ADC to Library. Briet intends this sale to provide Library with rights to use the ADC that are substantially equivalent to the rights Library would have in a physical print copy (e.g., a paperback or hard cover book) of the applicable literary work purchased by Library under the first sale doctrine, codified at 17 U.S.C. § 109.</p>
        <p>Briet understands that certain incidental copies may be made in the process of effectuating these rights, including without limitation, lending to one reader at a time per ADC, transferring the ADC from one hosting provider or device to another, updating the format of the ADC to interoperate with the storage or reading device of Library’s choice, or performing any other activity that would fall within Sections 107-121 of the US Copyright Act. For the avoidance of doubt, Briet intends the sale to include the right to resell the ADC.</p>
      </main>
      <Footer/>
    </div>
  )
}

BrietAboutPage.displayName = 'BrietAboutPage'

export default BrietAboutPage
