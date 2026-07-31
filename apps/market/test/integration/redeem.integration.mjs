import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createSanityWriteClient } from '@repo/sanity-client'
import { mintRedeemCode } from '../../lib/redeemCode.ts'
import redeem from '../../pages/api/redeem-lenny/[code].ts'
import { makeRes } from '../helpers/fakeRes.mjs'

// The whole purchase-to-import path against real Sanity. Not part of `npm test`:
// it needs SANITY_WRITE_TOKEN and network, and it writes documents.
//
// This is where the one-shot claim is actually verified. Content Lake accepts a
// malformed claim silently — no error, nothing matched — which reads as "already
// redeemed" and costs the buyer their purchase. A stubbed client answers however
// it was taught to and cannot show that.

const sanity = createSanityWriteClient()
const RUN = `test-e2e-${Date.now()}`
const BOOK = `${RUN}-book`
const SESSION = `cs_test_${RUN}`
const CODE_DOC = `redeem-${SESSION}`

const get = async (code) => {
  const res = makeRes()
  await redeem({ method: 'GET', query: { code } }, res)
  return res
}

before(async () => {
  const { dataset } = sanity.config()
  assert.notEqual(dataset, 'production', 'refusing to write test documents into production')

  // Reuse an existing file asset rather than uploading; the OLID is the form
  // Lenny's parser accepts (it strips OL/M and skips anything else).
  const fileRef = await sanity.fetch('*[_type=="book" && defined(file.asset)][0].file.asset._ref')
  assert.ok(fileRef, 'no book with a file asset to borrow')
  await sanity.create({
    _id: BOOK,
    _type: 'book',
    title: 'Integration test book',
    identifer_ol: 'OL32941311M',
    file: { _type: 'file', asset: { _type: 'reference', _ref: fileRef } },
  })
})

after(async () => {
  await sanity.delete(CODE_DOC).catch(() => {}) // referencing document first
  await sanity.delete(BOOK).catch(() => {})
  assert.equal(await sanity.fetch('count(*[_id in $ids])', { ids: [BOOK, CODE_DOC] }), 0)
})

test('a paid checkout mints a code that Lenny can redeem exactly once', async () => {
  const session = {
    id: SESSION,
    payment_status: 'paid',
    metadata: { briet_item_id: BOOK },
  }

  const code = await mintRedeemCode(session)
  assert.match(code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/)

  // reloading the receipt must not mint a second code for the same purchase
  assert.equal(await mintRedeemCode(session), code)

  const first = await get(code)
  assert.equal(first.statusCode, 200)
  assert.equal(first.body.books.length, 1)
  assert.equal(first.body.books[0].olid, 'OL32941311M')
  assert.match(first.body.books[0].url, /^https:\/\/cdn\.sanity\.io\/files\//)

  // the claim reached Content Lake, rather than merely being reported
  assert.ok(await sanity.fetch('*[_id == $id][0].redeemedAt', { id: CODE_DOC }))

  const replay = await get(code)
  assert.equal(replay.statusCode, 400)
  assert.deepEqual(replay.body, { error: 'already_redeemed' })
})
