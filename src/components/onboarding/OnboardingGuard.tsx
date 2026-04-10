'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppStore, type UserProfile } from '@/store/useAppStore'

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const userProfile = useAppStore((s) => s.userProfile)
  const setUserProfile = useAppStore((s) => s.setUserProfile)

  // Hydrate the store from localStorage on first mount
  useEffect(() => {
    if (userProfile) return
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem('mirai_profile')
      if (saved) {
        const parsed = JSON.parse(saved) as UserProfile
        if (parsed && parsed.direction) setUserProfile(parsed)
      }
    } catch {}
    // We only want this to run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redirect to onboarding if no profile and not already there
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Allowed paths even without onboarding
    const allowed = ['/', '/sign-in', '/sign-up']
    const isAllowed =
      pathname === '/' ||
      pathname.startsWith('/sign-in') ||
      pathname.startsWith('/sign-up')

    if (isAllowed) return

    const hasProfile =
      userProfile != null || !!window.localStorage.getItem('mirai_profile')
    if (!hasProfile) router.replace('/')
    void allowed
  }, [pathname, userProfile, router])

  return <>{children}</>
}
