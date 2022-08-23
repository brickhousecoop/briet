import Image from 'next/image'
import sanity from "./sanity"
import { useNextSanityImage } from 'next-sanity-image'

export default ({ sanityAsset }) => {
  const imageProps = useNextSanityImage(sanity, sanityAsset)
  return (
    <Image
      layout='intrinsic'
      {...imageProps}
    />
  )
}