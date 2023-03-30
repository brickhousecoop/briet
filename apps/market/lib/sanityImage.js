import Image from "next/legacy/image"
import { readOnlyClient as sanity} from "sanity-client"
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
