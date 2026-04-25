import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/loop(.*)',
  '/api/loop(.*)',
  '/api/lessons(.*)',
  '/api/japanese(.*)',
  '/api/scenarios(.*)',
  '/api/collection(.*)',
  '/api/vocabulary(.*)',
  '/saved-lessons(.*)',
  '/api/saved-lessons(.*)',
])

export default clerkMiddleware(async (_auth, req) => {
  // Public routes don't need auth
  if (isPublicRoute(req)) return

  // Everything else: client-side gates (OnboardingGuard) handle redirects.
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
