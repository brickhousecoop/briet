import Image from "next/image"
import { readOnlyClient as sanity} from "@repo/sanity-client"
import { useNextSanityImage } from 'next-sanity-image'

const SanityImage = ({ sanityAsset, alt }) => {
  const imageProps = useNextSanityImage(sanity, sanityAsset)
  return (
    <Image
      alt={alt}
      style={{
        maxWidth: "100%",
        height: "auto"
      }}
      {...imageProps}
    />
  )
}

SanityImage.displayName = 'SanityImage'

export default SanityImage
