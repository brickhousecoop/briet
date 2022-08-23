import Image from 'next/image'
import sanity from "./sanity"
import { useNextSanityImage } from 'next-sanity-image'

const SanityImage = ({ sanityAsset }) => {
  const imageProps = useNextSanityImage(sanity, sanityAsset)
  return (
    <Image
      layout='intrinsic'
      {...imageProps}
    />
  )
}

SanityImage.displayName = 'SanityImage'

export default sanityImage
