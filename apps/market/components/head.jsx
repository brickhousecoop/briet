import Head from 'next/head'

const BrietHead = ({ props }) =>
  <Head {...props}>
    <link rel="icon" type="image/svg+xml" href="/briet_icon.svg" />
    <link rel="icon" type="image/png" href="/briet_icon.png" />
    <meta property="og:image" content="/briet_opengraph.png" />
  </Head>

export default BrietHead
