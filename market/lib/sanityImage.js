import Image from 'next/image'
import sanity from "./sanity"
import { useNextSanityImage } from 'next-sanity-image'

const SanityImage = ({ sanityAsset, alt }) => {
  const imageProps = useNextSanityImage(sanity, sanityAsset)
  return (
    <Image
      layout='intrinsic'
      alt={alt}
      {...imageProps}
    />
  )
}

SanityImage.displayName = 'SanityImage'

export default SanityImage
