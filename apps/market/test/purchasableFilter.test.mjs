import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parse, evaluate } from 'groq-js'

// The filter is fixed when the module loads, so the flag is set before importing it.
process.env.HIDE_UNPURCHASABLE_BOOKS = '1'
const { purchasableFilter } = await import('@repo/sanity-client')

const epub = { _id: 'file-epub', _type: 'sanity.fileAsset', extension: 'epub' }
const fileOf = (asset) => ({ _type: 'file', asset: { _type: 'reference', _ref: asset._id } })

// The paid arm must exclude books with no usable price (Stripe minimum charge is
// $0.50), which checkout.ts would otherwise charge as Math.round(undefined * 100).
test('purchasableFilter requires a price of at least 0.50 on paid books', async () => {
  const books = [
    { _id: 'free-with-file', price_usd: 0, file: fileOf(epub) },
    { _id: 'paid-5', price_usd: 5, identifier_ol: 'OL1M', file: fileOf(epub) },
    { _id: 'paid-exactly-min', price_usd: 0.5, identifier_ol: 'OL1M', file: fileOf(epub) },
    { _id: 'paid-no-price', identifier_ol: 'OL1M', file: fileOf(epub) },
    { _id: 'paid-below-min', price_usd: 0.25, identifier_ol: 'OL1M', file: fileOf(epub) },
    { _id: 'free-no-file', price_usd: 0 },
  ]
  const result = await evaluate(parse(`*[_type == "book" && (${purchasableFilter})] { _id }`), {
    dataset: [epub, ...books.map((book) => ({ _type: 'book', ...book }))],
  })
  assert.deepEqual(await result.get(), [
    { _id: 'free-with-file' },
    { _id: 'paid-5' },
    { _id: 'paid-exactly-min' },
  ])
})
