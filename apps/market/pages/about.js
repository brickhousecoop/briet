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
          <span className="logo">BRIET</span> is <Link href="https://controlleddigitallending.org">for keeps</Link>.
        </h1>

        <p><strong>Book bans. Censorship. Threats against librarians’ personal safety.</strong> Attacks on free expression are on the rise in the U.S. But the most dangerous front in the war on culture transcends politics: Big business is fighting against freedom of information, and against libraries.</p>

        <p>Big publishers <Link href="https://www.thenation.com/article/culture/internet-archive-lawsuit-libraries/">have taken to the courts</Link> to force libraries to rent, rather than own, digital books. On one level, this is like taking a page from Spotify or Netflix; you used to buy CDs or movies you could own forever, to enjoy whenever you pleased. Now people typically pay every month for music and movies…and we’ll pay forever.</p>

        <p>But this isn’t only about big business changing the rules to squeeze libraries for more money. In the current atmosphere, books can be banned outright by some weirdo at any moment–and books that can only be owned temporarily are books that can disappear. <strong>Libraries need to own their own books outright, just as they always have.</strong></p>

        <p>If the big publishers (who should be ashamed of themselves) won’t protect libraries, the small ones must step in.</p>

        <p>We’re the <Link href="https://thebrick.house">Brick House</Link>, a small journalist-owned cooperative of independent publishers, writers, editors, artists and information activists around the world. We’ve published a few books by our members, and an anthology of our own work. When we realized we could easily demonstrate how easy it is for publishers to do the right thing, and sell our ebooks to libraries for keeps, we decided to go for it.</p>

        <p><strong>That’s why we’re building <span className="logo">BRIET</span>, a platform where publishers can sell their ebooks to libraries, for keeps.</strong> It’s named after the pioneering librarian and information scientist <Link href="https://en.wikipedia.org/wiki/Suzanne_Briet">Suzanne Briet</Link>.</p>

        <p><strong>Librarians: please buy, preserve and lend these ebooks!</strong> If your institution is a signatory to the <Link href="https://controlleddigitallending.org/statement">Position Statement</Link> on Controlled Digital Lending (CDL), you can buy permanent digital media at BRIET. <Link href="https://controlleddigitallending.org/faq/">Learn more about CDL</Link> and see the <Link href="https://controlleddigitallending.org/ill-signatories/">list of CDL signatories</Link>.</p>

        <p><strong>Readers, students, and friends: BRIET is for libraries.</strong> Ask your librarian to get in touch with us!</p>

        <p><strong>Some technical details:</strong> BRIET is a free and open platform for the acquisition of ebooks and other digital works by libraries that practice CDL. BRIET is built on the <Link href="https://specs.opds.io/opds-1.2">Open Publication Distribution System</Link> (OPDS) data standard, following the model of BookServer, an open architecture led by the Internet Archive. BRIET ebooks include full metadata in the OPDS catalog format.</p>

        <p>BRIET was made possible by generous gifts from the <Link href="https://archive.org/details/kahleaustinfoundation">Kahle-Austin Foundation</Link>, and <Link href="https://www.grantfortheweb.org">Grant for the Web</Link>.</p>

        <p>The Brick House Cooperative’s allied organization, the Participatory Politics Foundation (PPF), is a 501(c)(3) nonprofit organization founded in 2009 to increase civic engagement. Please get in touch to support our efforts to defend press freedom, libraries, and the digital future. Read more about BRIET: our pioneering <Link href="https://www.thenation.com/article/culture/libraries-digital-publishing-ebooks/">sale</Link> to the Internet Archive’s Open Library in 2021, and our cooperative’s work <Link href="https://popula.com/2022/01/12/buy-this-book-from-the-brick-house-cooperative/">defending library rights</Link>.</p>

        <p>Freedom of information is under threat in the United States, and libraries are in the line of fire. Donate to Brick House here so that we can keep the <span className="logo">BRIET</span> project going.</p>

        <link href="//cdn-images.mailchimp.com/embedcode/classic-071822.css" rel="stylesheet" type="text/css" />
        <div id="mc_embed_signup">
            <form action="https://house.us17.list-manage.com/subscribe/post?u=32a22cc8bacf327fb3bb5066e&amp;id=7757e9bd40&amp;f_id=006b5ae0f0" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" className="validate" target="_blank" noValidate>
                <div id="mc_embed_signup_scroll">
                <h2>And please sign up for our newsletter! It’s good.</h2>
                <div className="indicates-required"><span className="asterisk">*</span> indicates required</div>
        <div className="mc-field-group">
          <label htmlFor="mce-EMAIL">Email Address  <span className="asterisk">*</span>
        </label>
          <input type="email" name="EMAIL" className="required email" id="mce-EMAIL" required />
          <span id="mce-EMAIL-HELPERTEXT" className="helper_text"></span>
        </div>
        <div hidden="true"><input type="hidden" name="tags" value="6561264" /></div>
          <div id="mce-responses" className="clear">
            <div className="response" id="mce-error-response" style={{display: 'none'}}></div>
            <div className="response" id="mce-success-response" style={{display: 'none'}}></div>
          </div>
            <div style={{position: 'absolute', left: '-5000px'}} aria-hidden="true"><input type="text" name="b_32a22cc8bacf327fb3bb5066e_7757e9bd40" tabIndex="-1" value="" /></div>
            <div className="clear"><input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" className="button" /></div>
            </div>
        </form>
        </div>
      </main>
      <Footer/>
    </div>
  )
}

BrietAboutPage.displayName = 'BrietAboutPage'

export default BrietAboutPage
