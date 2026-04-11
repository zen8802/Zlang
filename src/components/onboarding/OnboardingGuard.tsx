'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useAppStore, type UserProfile } from '@/store/useAppStore'

function isValidProfile(p: unknown): p is UserProfile {
  if (!p || typeof p !== 'object') return false
  const obj = p as Record<string, unknown>
  return obj.direction === 'en-to-jp' || obj.direction === 'jp-to-en'
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const userProfile = useAppStore((s) => s.userProfile)
  const setUserProfile = useAppStore((s) => s.setUserProfile)
  const setKnownHiragana = useAppStore((s) => s.setKnownHiragana)
  const setWorldNumber = useAppStore((s) => s.setWorldNumber)

  // Hydrate the store from Clerk metadata first (per-user, cross-device),
  // then fall back to localStorage (per-browser).
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Hydrate hiragana progress from Clerk + localStorage on every mount.
    // (This runs even if userProfile is already loaded.)
    if (isLoaded && user) {
      const meta = user.unsafeMetadata as
        | { knownHiragana?: unknown; worldNumber?: unknown }
        | undefined
      if (Array.isArray(meta?.knownHiragana)) {
        setKnownHiragana(meta.knownHiragana.filter((c): c is string => typeof c === 'string'))
        try {
          window.localStorage.setItem(
            'mirai_known_hiragana',
            JSON.stringify(meta.knownHiragana),
          )
        } catch {}
      } else {
        try {
          const cached = window.localStorage.getItem('mirai_known_hiragana')
          if (cached) {
            const parsed = JSON.parse(cached)
            if (Array.isArray(parsed)) {
              setKnownHiragana(parsed.filter((c): c is string => typeof c === 'string'))
            }
          }
        } catch {}
      }
      if (typeof meta?.worldNumber === 'number') setWorldNumber(meta.worldNumber)
    }

    if (userProfile) return

    // 1. Clerk unsafeMetadata.miraiProfile — survives across browsers + devices
    if (isLoaded && user) {
      const metaProfile = (user.unsafeMetadata as { miraiProfile?: unknown } | undefined)
        ?.miraiProfile
      if (isValidProfile(metaProfile)) {
        setUserProfile(metaProfile)
        // Mirror back to localStorage for instant boot next time
        try {
          window.localStorage.setItem('mirai_profile', JSON.stringify(metaProfile))
        } catch {}
        return
      }
    }

    // 2. localStorage fallback
    try {
      const saved = window.localStorage.getItem('mirai_profile')
      if (saved) {
        const parsed = JSON.parse(saved) as unknown
        if (isValidProfile(parsed)) setUserProfile(parsed)
      }
    } catch {}
  }, [isLoaded, user, userProfile, setUserProfile, setKnownHiragana, setWorldNumber])

  // Routing: if profile exists and we're on `/`, send straight to dashboard.
  // If no profile and we're somewhere protected, send to `/` for onboarding.
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Wait for Clerk to load before deciding — otherwise we may bounce
    // a returning user through onboarding before their metadata arrives.
    if (!isLoaded) return

    const onAuthPage =
      pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')
    if (onAuthPage) return

    const hasProfile =
      userProfile != null ||
      (typeof window !== 'undefined' &&
        !!window.localStorage.getItem('mirai_profile')) ||
      isValidProfile(
        (user?.unsafeMetadata as { miraiProfile?: unknown } | undefined)
          ?.miraiProfile,
      )

    if (pathname === '/') {
      // Onboarding screen — skip it for returning users
      if (hasProfile) router.replace('/dashboard')
      return
    }

    // Any other route — require a profile, otherwise back to onboarding
    if (!hasProfile) router.replace('/')
  }, [pathname, userProfile, router, isLoaded, user])

  return <>{children}</>
}
