import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/claude(.*)',
  '/api/youtube(.*)',
  '/api/chat(.*)',
  '/api/clips(.*)',
  '/api/transcribe(.*)',
  '/lessons(.*)',
  '/share(.*)',
  '/studio(.*)',
  '/api/studio(.*)',
  '/admin(.*)',
  '/loop(.*)',
  '/api/loop(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Public routes don't need auth
  if (isPublicRoute(req)) return

  // Lesson pages: lesson 1 of each corridor is free
  // Lesson IDs look like 'en-jp-1-1' or 'jp-en-1-1'
  // The URL is /lesson/en-jp-1-1
  const url = req.nextUrl.pathname
  if (url.startsWith('/lesson/')) {
    const lessonId = url.replace('/lesson/', '')
    // First lesson of each corridor is free (ends with -1-1)
    if (lessonId.endsWith('-1-1')) return
  }

  // Everything else: protect if user isn't signed in
  // But don't hard-block — let the client-side gate handle the redirect
  // This allows the page to render and show the gate UI
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
