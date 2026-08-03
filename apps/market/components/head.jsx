import Head from 'next/head'

// og:image must be absolute: scrapers resolve it out of context, not against the page URL.
const SITE_ORIGIN = 'https://market.briet.app'

const BrietHead = ({ children }) =>
  <Head>
    {children}
    <link rel="icon" type="image/svg+xml" href="/briet_icon.svg" />
    <link rel="icon" type="image/png" href="/briet_icon.png" />
    <meta property="og:image" content={`${SITE_ORIGIN}/briet_opengraph.png`} />
  </Head>

export default BrietHead
