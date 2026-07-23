import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'

// two options, optimized according to permissions
// https://www.sanity.io/help/js-client-usecdn-token

const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECTID
                     || process.env.SANITY_STUDIO_SANITY_PROJECTID
                     || process.env.SANITY_PROJECTID;

const sanityDataset   = process.env.NEXT_PUBLIC_SANITY_DATASET
                     || process.env.SANITY_STUDIO_SANITY_DATASET
                     || process.env.SANITY_DATASET;

const sanityToken = process.env.SANITY_TOKEN;

const sanityConfig = {
  projectId: sanityProjectId,
  dataset: sanityDataset,
  token: sanityToken,
  apiVersion: '2025-11-18',
  useCdn: true,
}

export function createSanityClient(overrides = {}) {
  return createClient({
    ...sanityConfig,
    perspective: 'published',
    ...overrides,
  })
}

const sanity = createSanityClient()
export default sanity

const builder = createImageUrlBuilder(sanity)

// Sanity image asset refs encode their dimensions: image-<hash>-<width>x<height>-<ext>
export function assetDimensions(ref: string) {
  const [width, height] = ref.split('-')[2]?.split('x').map(Number) ?? []
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(`Malformed Sanity asset ref (expected image-<hash>-<W>x<H>-<ext>): ${ref}`)
  }
  return { width, height }
}

// next/image loader: hand each requested width to Sanity's CDN so the browser gets a
// real responsive srcset (and auto WebP/AVIF) straight from the source, instead of Next
// re-optimizing an already-resized image. `src` is the asset _ref.
export function sanityImageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  return builder.image(src).width(width).quality(quality || 75).auto('format').url()
}
