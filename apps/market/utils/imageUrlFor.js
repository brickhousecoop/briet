import sanity from '@repo/sanity-client'
import { createImageUrlBuilder } from '@sanity/image-url'

const imageBuilder = createImageUrlBuilder(sanity)

const imageUrlFor = source => imageBuilder.image(source)

export default imageUrlFor
