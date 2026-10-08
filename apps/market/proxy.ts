import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAccountRoute = createRouteMatcher(['/account(.*)'])
const isPublicRoute = createRouteMatcher([
  '/account/sign-in(.*)',
  '/account/sign-up(.*)',
])

export default clerkMiddleware(
  async (auth, request) => {
    if (isAccountRoute(request) && !isPublicRoute(request)) {
      await auth.protect()
    }
  },
  // Without these, Clerk redirects to its hosted Account Portal instead of the
  // sign-in pages in this app.
  {
    signInUrl: '/account/sign-in',
    signUpUrl: '/account/sign-up',
  },
)

export const config = {
  matcher: [
    // Account pages are protected here; purchase handlers check auth themselves.
    '/account/:path*',
    '/api/checkout',
    '/order/:path*',
    '/api/download/order/:sessionId',
  ],
}
