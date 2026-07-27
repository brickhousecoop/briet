import { test } from 'node:test'
import assert from 'node:assert/strict'

// sanityImageLoader binds to a client built from env at import time; set a fake
// project so URLs are deterministic. Dynamic import runs after env is set.
process.env.NEXT_PUBLIC_SANITY_PROJECTID = 'testproj'
process.env.NEXT_PUBLIC_SANITY_DATASET = 'production'
process.env.SANITY_TOKEN = 'faketoken'
const { assetDimensions, sanityImageLoader } = await import('./main.ts')

const REF = 'image-abc123-2550x3300-jpg'

test('assetDimensions parses width/height out of a canonical asset ref', () => {
  assert.deepEqual(assetDimensions(REF), { width: 2550, height: 3300 })
})

test('assetDimensions throws on a malformed ref instead of returning bad dimensions', () => {
  assert.throws(() => assetDimensions('image-abc-notdims-jpg'), /Malformed/) // junk chunk -> NaN
  assert.throws(() => assetDimensions('image-abc-800-jpg'), /Malformed/)     // missing height
  assert.throws(() => assetDimensions('foobar'), /Malformed/)                // too few segments
})

test('sanityImageLoader resizes at the requested width, straight from Sanity, with auto format', () => {
  const url = sanityImageLoader({ src: REF, width: 828, quality: 80 })
  assert.match(url, /^https:\/\/cdn\.sanity\.io\/images\/testproj\/production\/abc123-2550x3300\.jpg/)
  assert.match(url, /[?&]w=828\b/)
  assert.match(url, /[?&]q=80\b/)
  assert.match(url, /[?&]auto=format\b/)
})

test('sanityImageLoader defaults quality to 75, and different widths give different URLs', () => {
  assert.match(sanityImageLoader({ src: REF, width: 640 }), /[?&]q=75\b/)
  assert.notEqual(
    sanityImageLoader({ src: REF, width: 640 }),
    sanityImageLoader({ src: REF, width: 1200 }),
  )
})
