import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

export const config = {
  matcher: [
    // Only run middleware (Clerk auth) on /account/* paths
    '/account/:path*',
  ],
}

const isPublicRoute = createRouteMatcher([
  // Override above rule to make signin & signup pages public
  '/account/sign-in(.*)',
  '/account/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})
