import type { getAuth } from '@clerk/nextjs/server'

// The signed-in Clerk user for a Pages Router request, or null. Clerk loads lazily
// because its server entry only resolves under Next's bundler, and the unit tests
// import route handlers in plain Node with this function injected instead.
export async function getPagesUser(req: Parameters<typeof getAuth>[0]) {
  const { clerkClient, getAuth } = await import('@clerk/nextjs/server')
  const { userId } = getAuth(req)
  if (!userId) return null
  return (await clerkClient()).users.getUser(userId)
}
