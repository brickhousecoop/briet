"use client";

import Img from 'next/image'
import { assetDimensions, sanityImageLoader } from '@repo/sanity-client'

export default function PortableImage({
  asset,
}: {
  asset: { _ref: string }
}) {
  // an image block with no asset selected (incomplete content) renders nothing
  if (!asset?._ref) return null

  const { width, height } = assetDimensions(asset._ref)

  return (
    <Img
      loader={sanityImageLoader}
      src={asset._ref}
      alt=""
      width={width}
      height={height}
      sizes="(max-width: 800px) 100vw, 800px"
      style={{ width: '100%', height: 'auto' }}
    />
  )
}
