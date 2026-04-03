export function getPostSignupRedirect(): string {
  if (typeof window === 'undefined') return '/dashboard'

  const intended = localStorage.getItem('zlang_intended_lesson')
  if (intended) {
    localStorage.removeItem('zlang_intended_lesson')
    return `/lesson/${intended}`
  }
  return '/dashboard'
}
