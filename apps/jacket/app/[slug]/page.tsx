import type { Metadata, ResolvingMetadata } from 'next'
// import dynamic from 'next/dynamic'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
// import { toPlainText } from 'next-sanity'
import { readOnlyClient as sanity } from 'sanity-client'

import '@/styles/globals.css'
import styles from '@/styles/Home.module.css'

import Footer from '@/components/footer'
import PortablePageContent from '@/components/PortablePageContent'

// const PagePreview = dynamic(() => import('@/components/pages/page/PagePreview'))

type Props = {
  params: { slug: string }
}

const pageBySlugQuery = `
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    content,
    "slug": slug.current,
  }
`

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const page = await sanity.fetch(pageBySlugQuery, {slug: params.slug})

  return {
    title: page?.title ? `BRIET: ${page.title}` : 'BRIET Marketplace'
    // description: page?.overview TODO: add to Sanity
    //   ? toPlainText(page.overview)
    //   : (await parent).description,
  }
}

export default async function PageSlugRoute({ params }: Props) {
  const page = await sanity.fetch(pageBySlugQuery, {slug: params.slug})

  console.log('page', page)

  // if (draftMode().isEnabled) {
  //   return <PagePreview params={params} initial={page} />
  // }

  if (!page?.content) {
    notFound()
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          <span className="logo">BRIET</span> {page.title}
        </h1>

        <PortablePageContent value={page.content} />
      </main>
      <Footer/>
    </div>
    )
}