import { test, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { startFakeSanity } from './helpers/fakeSanity.mjs'
import { makeRes } from './helpers/fakeRes.mjs'

// Lenny GETs this with a one-time code and imports whatever books come back. The
// code is a bearer token spent on first use, so the status codes and the one-shot
// claim are the contract. Runs against a fake Content Lake via the real client and
// real GROQ evaluation, so this covers the request/response contract but not whether
// Content Lake accepts the query; redeem.integration.mjs keeps that.

const fake = await startFakeSanity()
after(() => fake.close())

const { default: handler } = await import('../pages/api/redeem-lenny/[code].ts')

const get = async (code) => {
  const res = makeRes()
  await handler({ method: 'GET', query: { code } }, res, { read: fake.client(), write: fake.client() })
  return res
}

// The redeem query dereferences file.asset->url, so seed the book's file as an asset
// reference (a file-<hash>-<ext> asset doc) as Content Lake stores it.
const EPUB_URL = 'https://cdn.sanity.io/files/p/production/def456.epub'
const epubAsset = { _id: 'file-def456-epub', _type: 'sanity.fileAsset', url: EPUB_URL }
const book = {
  _id: 'book-1',
  _type: 'book',
  title: 'The Test Book',
  identifer_ol: 'OL32941311M',
  file: { _type: 'file', asset: { _type: 'reference', _ref: 'file-def456-epub' } },
}
const importable = { olid: 'OL32941311M', title: 'The Test Book', url: EPUB_URL }

const redeemDoc = (books, redeemedAt = null) => ({
  _id: 'redeem-cs_test_123',
  _type: 'redeemCode',
  code: 'ABCD-1234',
  redeemedAt,
  books: books.map((b) => ({ _type: 'reference', _ref: b._id, _key: b._id })),
})

beforeEach(() => {
  fake.reset()
  fake.seed([epubAsset, book, redeemDoc([book])])
})

test('a valid code returns its books and is spent in the same request', async () => {
  const res = await get('abcd-1234')

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { books: [importable] })
  assert.ok(fake.doc('redeem-cs_test_123').redeemedAt) // claimed
})

test('reusing a spent code is rejected, and the books are not returned again', async () => {
  await get('abcd-1234')
  const res = await get('abcd-1234')

  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { error: 'already_redeemed' })
  assert.equal(fake.calls.mutations.filter((m) => m.patch).length, 1) // claimed exactly once
})

test('an unknown code is a 404', async () => {
  const res = await get('nope-nope')

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { error: 'not_found' })
})

test('books Lenny cannot import are dropped rather than returned half-formed', async () => {
  const noOlid = { _id: 'no-olid', _type: 'book', title: 'No OLID', identifer_ol: null, file: book.file }
  const noFile = { _id: 'no-file', _type: 'book', title: 'No file', identifer_ol: 'OL1M', file: null }
  fake.seed([noOlid, noFile, redeemDoc([book, noOlid, noFile])])
  const res = await get('abcd-1234')

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { books: [importable] })
})

test('a bundle with nothing importable fails without burning the code', async () => {
  const noOlid = { _id: 'no-olid', _type: 'book', title: 'No OLID', identifer_ol: null, file: null }
  fake.seed([noOlid, redeemDoc([noOlid])])
  const res = await get('abcd-1234')

  assert.equal(res.statusCode, 422)
  assert.deepEqual(res.body, { error: 'nothing_to_import' })

  // the cataloguing gap is fixable in the Studio; the purchase must survive it
  assert.equal(fake.doc('redeem-cs_test_123').redeemedAt, null)
})

test('non-GET is rejected with 405 and an Allow header', async () => {
  const res = makeRes()
  await handler({ method: 'POST', query: {} }, res, { read: fake.client(), write: fake.client() })

  assert.equal(res.statusCode, 405)
  assert.equal(res.headers['Allow'], 'GET')
})
