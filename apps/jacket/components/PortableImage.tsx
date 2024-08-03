"use client";

import type { Image } from 'sanity'
import Img from 'next/image'
import { readOnlyClient as sanityClient } from 'sanity-client'
import { useNextSanityImage } from 'next-sanity-image'

export default function PortableImage({
	asset,
}: {
  asset: Image & { alt?: string; caption?: string }
}) {
	console.log('asset', asset)

  const imageProps = useNextSanityImage(sanityClient, asset)

  if (!imageProps) return null;

  return (
    <Img {...imageProps} alt='' layout='responsive' sizes='(max-width: 800px) 100vw, 800px' />
  )
}

