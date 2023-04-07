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
          <span className="logo">BRIET</span> is <a href="https://controlleddigitallending.org">for keeps</a>.
        </h1>

        <p>BRIET is a project of <Link href="https://thebrick.house">The Brick House Cooperative</Link>, a journalist- and creator-owned cooperative of independent publications around the world. The BRIET project’s mission is to defend the historical right of libraries to own, preserve and lend digital works to the public. It is named after the pioneering librarian and information scientist <Link href="https://en.wikipedia.org/wiki/Suzanne_Briet">Suzanne “Madame Documentation” Briet</Link>.</p>

        <p><strong>Librarians and teachers: buy these ebooks!</strong> If your institution is a signatory to the <Link href="https://controlleddigitallending.org/statement">Position Statement</Link> on Controlled Digital Lending (CDL), you can acquire and own BRIET works to lend to patrons. See the <Link href="https://controlleddigitallending.org/ill-signatories/">list of CDL signatories</Link>.</p>

        <p>To begin the process of purchasing digital works on BRIET, or find out how to become a CDL signatory, <Link href="mailto:help@briet.app">contact us</Link>.</p>

        <p>BRIET is an entirely free and open platform for the acquisition of ebooks and other digital works, like podcasts and videos, by libraries and institutions that practice CDL. We believe BRIET to be a uniquely open-source platform based in the U.S. for the acquisition of ebooks, built on the <Link href="https://specs.opds.io/opds-1.2">Open Publication Distribution System</Link> (OPDS) data standard.</p>

        <p>The BRIET project follows the model of BookServer, an open architecture led by the Internet Archive for vending and lending digital books over the Internet, built on open catalog and book formats. This early version of BRIET will accomplish the following:</p>

        <ul>
          <li>Permit authors and publishers to sell ebooks to libraries through the BRIET Market for circulation through Controlled Digital Lending (CDL) programs</li>
          <li>Allow librarians to acquire permanent ebooks with full metadata in the OPDS catalog format</li>
          <li>List hundreds of digital works such as ebooks for acquisition by libraries and institutions, encouraging use and awareness of CDL programs among readers</li>
        </ul>

        <p>The BRIET project was supported in prototype by a generous gift from the Kahle-Austin Foundation. The foundation’s founders are Brewster Kahle, founder of the Internet Archive, and Mary Austin, who established the San Francisco Center for the book.</p>

        <p>Freedom of information is under threat. To preserve it, the flow of information must remain clear and strong. Writers, academics and artists, publishers, librarians, educators, and individual readers—all must preserve the right to share our views freely and without interference.</p>

        <p>We seek charitable funding support to maintain the new BRIET platform, expand its catalog of works for libraries and schools to acquire, and develop its open technologies. The Brick House Cooperative’s allied organization, the Participatory Politics Foundation (PPF), is a 501(c)(3) nonprofit organization founded in 2009 to increase civic engagement. Please get in touch to support our efforts to defend press freedom, libraries, and the digital future. Contact: David Moore and Maria Bustillos, Project Managers</p>

        <p>Read more about <span className="logo">BRIET</span>: our pioneering <Link href="https://www.thenation.com/article/culture/libraries-digital-publishing-ebooks/">sale</Link> of one ebook to the Internet Archive’s Open Library in 2021, and our cooperative’s work <Link href="https://popula.com/2022/01/12/buy-this-book-from-the-brick-house-cooperative/">defending library rights</Link>.</p>
      </main>
      <Footer/>
    </div>
  )
}

BrietAboutPage.displayName = 'BrietAboutPage'

export default BrietAboutPage
