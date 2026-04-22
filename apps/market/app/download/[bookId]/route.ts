import { auth } from '@clerk/nextjs/server'
import { readOnlyClient as sanity } from '@repo/sanity-client'
import { findApprovedOrderForBook } from '@lib/stripe'

export const dynamic = 'force-dynamic'

const bookFileQuery = `
  *[_type == "book" && _id == $id] {
    _id,
    title,
    "downloadUrl": file.asset->url,
    "originalFilename": file.asset->originalFilename,
    "mimeType": file.asset->mimeType,
  }[0]
`

type SanityBookFile = {
  _id: string
  title: string
  downloadUrl: string | null
  originalFilename: string | null
  mimeType: string | null
}

function safeFilename(title: string, ext: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 120)
  return `${slug || 'book'}${ext}`
}

export async function GET(
  _req: Request,
  { params }: { params: { bookId: string } }
) {
  const { bookId } = params
  const { userId, orgId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const order = await findApprovedOrderForBook({ orgId, userId, bookId })
  if (!order) {
    return new Response(
      'No approved order found for this book under your current organization.',
      { status: 403 }
    )
  }

  const book = (await sanity.fetch(bookFileQuery, { id: bookId })) as SanityBookFile | null
  if (!book?.downloadUrl) {
    return new Response('Book file not available', { status: 404 })
  }

  const upstream = await fetch(book.downloadUrl)
  if (!upstream.ok || !upstream.body) {
    return new Response('Upstream file fetch failed', { status: 502 })
  }

  const ext = book.originalFilename ? book.originalFilename.match(/\.[^.]+$/)?.[0] ?? '' : ''
  const filename = safeFilename(book.title, ext)

  const headers = new Headers()
  headers.set('Content-Type', book.mimeType || upstream.headers.get('content-type') || 'application/octet-stream')
  headers.set('Content-Disposition', `attachment; filename="${filename}"`)
  const len = upstream.headers.get('content-length')
  if (len) headers.set('Content-Length', len)
  headers.set('Cache-Control', 'private, no-store')

  return new Response(upstream.body, { status: 200, headers })
}
