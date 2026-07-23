import Image from "next/image"
import { assetDimensions, sanityImageLoader } from "@repo/sanity-client"

const SanityImage = ({ sanityAsset, alt }) => {
  const ref = sanityAsset?.asset?._ref
  if (!ref) return null

  const { width, height } = assetDimensions(ref)

  return (
    <Image
      loader={sanityImageLoader}
      src={ref}
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
