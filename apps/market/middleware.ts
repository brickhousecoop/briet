import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/account/sign-in(.*)',
  '/account/sign-up(.*)',
])

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
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
    // Only run middleware (Clerk auth) on /account/* paths
    '/account/:path*',
  ],
}
