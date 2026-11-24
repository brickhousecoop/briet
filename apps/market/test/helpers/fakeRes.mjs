// A minimal NextApiResponse stand-in capturing what the handlers write.
// `redirect` is only used by checkout but costs nothing to carry.
export const makeRes = () => {
  const res = { statusCode: null, body: null, headers: {} }
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (body) => { res.body = body; return res }
  res.setHeader = (key, value) => { res.headers[key] = value; return res }
  res.end = (body) => { res.body = body; return res }
  res.redirect = (code, url) => { res.statusCode = code; res.redirectUrl = url; return res }
  return res
}
