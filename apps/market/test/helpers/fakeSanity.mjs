import http from 'node:http'
import { createClient } from '@sanity/client'
import { parse, evaluate } from 'groq-js'

// A fake Content Lake the REAL @sanity/client talks to over HTTP. Unlike a
// module mock, this exercises the client's actual request construction and
// response parsing — the seam where the one-shot-claim bug shipped (a malformed
// patch query that Content Lake silently matches nothing against).
//
// Queries and mutations run through `groq-js`, so GROQ predicates and reference
// dereferencing are really evaluated — a fake that hand-matched would pass an
// always-matching handler bug. This covers the request/response *contract*. It
// cannot prove Content Lake accepts a query; redeem.integration.mjs keeps that.
//
// node:test runs each test file in its own process, so each suite gets its own
// server on an ephemeral port; the store is per-server. See packages/sanity-client.

const runQuery = async (docs, query, params = {}) =>
  evaluate(parse(query), { dataset: [...docs.values()], params }).then((r) => r.get())

// A query selection yields _ids; used to honor a patch's `query` predicate.
const matchingIds = async (docs, query, params) => {
  const result = await runQuery(docs, query, params)
  return new Set(Array.isArray(result) ? result.map((d) => d?._id ?? d) : [])
}


export async function startFakeSanity() {
  const store = new Map()
  const calls = { mutations: [] }

  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const u = new URL(req.url, 'http://localhost')
      res.setHeader('Content-Type', 'application/json')

      if (u.pathname.includes('/data/query/')) {
        const query = u.searchParams.get('query')
        const params = {}
        for (const [k, v] of u.searchParams) if (k.startsWith('$')) params[k.slice(1)] = JSON.parse(v)
        return runQuery(store, query, params).then((result) => res.end(JSON.stringify({ ms: 1, result })))
      }

      if (u.pathname.includes('/data/mutate/')) {
        return (async () => {
          const { mutations } = JSON.parse(body)
          const results = []
          for (const m of mutations) {
            calls.mutations.push(m)
            if (m.createIfNotExists) {
              const doc = m.createIfNotExists
              const existed = store.has(doc._id)
              if (!existed) store.set(doc._id, doc)
              results.push({ id: doc._id, operation: existed ? 'update' : 'create', document: store.get(doc._id) })
            } else if (m.patch) {
              const ids = m.patch.query
                ? await matchingIds(store, m.patch.query, m.patch.params ?? {})
                : new Set([m.patch.id])
              for (const id of ids) {
                if (!store.has(id)) continue
                Object.assign(store.get(id), m.patch.set ?? {})
                results.push({ id, operation: 'update' })
              }
            }
          }
          res.end(JSON.stringify({ transactionId: 'tx', results }))
        })()
      }

      res.statusCode = 404
      res.end(JSON.stringify({ error: 'unknown path', path: u.pathname }))
    })
  })

  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()

  const makeClient = () =>
    createClient({
      projectId: 'test-project',
      dataset: 'test',
      apiVersion: '2025-11-18',
      token: 'test-token',
      apiHost: `http://localhost:${port}`,
      useProjectHostname: false,
      useCdn: false,
    })

  const reset = () => { store.clear(); calls.mutations.length = 0 }

  return {
    port,
    calls,
    client: makeClient, // read + write share the fake; the distinction is the token, not the host
    seed: (docs) => { for (const d of docs) store.set(d._id, d) },
    doc: (id) => store.get(id),
    reset,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}
