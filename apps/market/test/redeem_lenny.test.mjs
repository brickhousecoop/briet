import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// Lenny GETs this with a one-time code and imports whatever books come back.
// The code is a bearer token spent on first use, so the status codes and the
// one-shot claim are the contract. Sanity is the only boundary mocked; the
// patch mock stands in for the conditional write that does the claiming.

let record // what the code lookup returns
let claimedIds // ids the conditional patch actually matched

const patchBuilder = (selection) => ({
  set: () => ({
    commit: async () => {
      // the real patch matches only while redeemedAt is unset
      const hit = !record?.redeemedAt && selection.params.id === record?._id
      if (hit) {
        record.redeemedAt = new Date().toISOString()
        claimedIds.push(selection.params.id)
      }
      return { results: hit ? [{ id: selection.params.id }] : [] }
    },
  }),
})

mock.module('@repo/sanity-client', {
  namedExports: {
    createSanityClient: () => ({
      fetch: async () => record,
      patch: patchBuilder,
    }),
  },
})

const { default: handler } = await import('../pages/api/redeem-lenny/[code].ts')

const makeRes = () => {
  const res = { statusCode: null, body: null, headers: {} }
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (body) => { res.body = body; return res }
  res.setHeader = (key, value) => { res.headers[key] = value; return res }
  res.end = (body) => { res.body = body; return res }
  return res
}

const get = async (code) => {
  const res = makeRes()
  await handler({ method: 'GET', query: { code } }, res)
  return res
}

const importableBook = {
  olid: 'OL32941311M',
  title: 'The Test Book',
  url: 'https://cdn.sanity.io/files/p/production/book.epub',
}

beforeEach(() => {
  claimedIds = []
  record = { _id: 'redeem-cs_test_123', redeemedAt: null, books: [importableBook] }
})

test('a valid code returns its books and is spent in the same request', async () => {
  const res = await get('abcd-1234')

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { books: [importableBook] })
  assert.deepEqual(claimedIds, ['redeem-cs_test_123'])
})

test('reusing a spent code is rejected, and the books are not returned again', async () => {
  await get('abcd-1234')
  const res = await get('abcd-1234')

  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { error: 'already_redeemed' })
  assert.deepEqual(claimedIds, ['redeem-cs_test_123']) // claimed exactly once
})

test('an unknown code is a 404', async () => {
  record = null
  const res = await get('nope-nope')

  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { error: 'not_found' })
})

test('books Lenny cannot import are dropped rather than returned half-formed', async () => {
  record.books = [importableBook, { olid: null, url: 'x' }, { olid: 'OL1M', url: null }]
  const res = await get('abcd-1234')

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { books: [importableBook] })
})

test('non-GET is rejected with 405 and an Allow header', async () => {
  const res = makeRes()
  await handler({ method: 'POST', query: {} }, res)

  assert.equal(res.statusCode, 405)
  assert.equal(res.headers['Allow'], 'GET')
})
