import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/account/sign-in(.*)',
  '/account/sign-up(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Only run middleware (Clerk auth) on /account/* paths
    '/account/:path*',
  ],
}
