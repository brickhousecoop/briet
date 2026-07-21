import Image from "next/image"
import { createImageUrlBuilder } from "@sanity/image-url"
import sanity from "@repo/sanity-client"

const builder = createImageUrlBuilder(sanity)

// Sanity image asset refs encode their dimensions: image-<hash>-<width>x<height>-<ext>
function assetDimensions(ref) {
  const [width, height] = ref.split('-')[2].split('x').map(Number)
  return { width, height }
}

const SanityImage = ({ sanityAsset, alt }) => {
  const ref = sanityAsset?.asset?._ref
  if (!ref) return null

  const { width, height } = assetDimensions(ref)

  return (
    <Image
      src={builder.image(sanityAsset).width(800).url()}
      alt={alt}
      width={width}
      height={height}
      sizes="(max-width: 800px) 100vw, 800px"
      style={{ maxWidth: "100%", height: "auto" }}
    />
  )
}

SanityImage.displayName = 'SanityImage'

export default SanityImage
