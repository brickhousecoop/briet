"use client";

import Img from 'next/image'
import { createImageUrlBuilder } from '@sanity/image-url'
import sanity from '@repo/sanity-client'

const builder = createImageUrlBuilder(sanity)

// Sanity image asset refs encode their dimensions: image-<hash>-<width>x<height>-<ext>
function assetDimensions(ref: string) {
  const [width, height] = ref.split('-')[2].split('x').map(Number)
  return { width, height }
}

export default function PortableImage({
  asset,
}: {
  asset: { _ref: string }
}) {
  if (!asset?._ref) return null

  const { width, height } = assetDimensions(asset._ref)

  return (
    <Img
      src={builder.image(asset).width(800).url()}
      alt=""
      width={width}
      height={height}
      sizes="(max-width: 800px) 100vw, 800px"
      style={{ width: '100%', height: 'auto' }}
    />
  )
}
