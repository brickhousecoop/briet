import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parse, evaluate } from 'groq-js'

// The filter is fixed when the module loads, so the flag is set before importing it.
process.env.HIDE_UNPURCHASABLE_BOOKS = '1'
const { purchasableFilter } = await import('@repo/sanity-client')

const epub = { _id: 'file-epub', _type: 'sanity.fileAsset', extension: 'epub' }
const pdf = { _id: 'file-pdf', _type: 'sanity.fileAsset', extension: 'pdf' }
const fileOf = (asset) => ({ _type: 'file', asset: { _type: 'reference', _ref: asset._id } })

const purchasableIds = async (books) => {
  const result = await evaluate(parse(`*[_type == "book" && ${purchasableFilter}]._id`), {
    dataset: [epub, pdf, ...books.map((book) => ({ _type: 'book', ...book }))],
  })
  return result.get()
}

test('free books need a file of any type', async () => {
  assert.deepEqual(await purchasableIds([
    { _id: 'free-pdf', price_usd: 0, file: fileOf(pdf) },
    { _id: 'free-nofile', price_usd: 0 },
  ]), ['free-pdf'])
})

test('paid books need an OLID and an EPUB', async () => {
  assert.deepEqual(await purchasableIds([
    { _id: 'paid-epub', price_usd: 5, identifier_ol: 'OL1M', file: fileOf(epub) },
    { _id: 'paid-pdf', price_usd: 5, identifier_ol: 'OL1M', file: fileOf(pdf) },
    { _id: 'paid-no-olid', price_usd: 5, file: fileOf(epub) },
  ]), ['paid-epub'])
})
