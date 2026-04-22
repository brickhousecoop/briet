import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

export const config = {
  matcher: [
    '/account/:path*',
    '/download/:path*',
    '/api/checkout_sessions',
  ],
}

const isPublicRoute = createRouteMatcher([
  '/account/sign-in(.*)',
  '/account/sign-up(.*)',
])

const isProtectedUiRoute = createRouteMatcher([
  '/account(.*)',
  '/download/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedUiRoute(req) && !isPublicRoute(req)) {
    await auth.protect()
  }
})
