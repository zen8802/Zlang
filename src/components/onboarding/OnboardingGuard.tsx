'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useAppStore, type UserProfile } from '@/store/useAppStore'

function isValidProfile(p: unknown): p is UserProfile {
  if (!p || typeof p !== 'object') return false
  const obj = p as Record<string, unknown>
  return obj.direction === 'en-to-jp' || obj.direction === 'jp-to-en'
}

/**
 * Decides whether the current user needs onboarding. Three signals, checked
 * in order of speed:
 *   1. Zustand store (already in memory)
 *   2. localStorage (synchronous, runs in first effect tick)
 *   3. Clerk unsafeMetadata (round-trip, only consulted if the first two miss)
 *
 * The guard exposes a `resolved` state so the `/` route can hold off
 * mounting the onboarding wizard until we know whether to redirect. Without
 * this, returning users see the onboarding flash for the entire duration
 * of the Clerk handshake (5-10s on cold networks).
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const userProfile = useAppStore((s) => s.userProfile)
  const setUserProfile = useAppStore((s) => s.setUserProfile)
  const setWorldNumber = useAppStore((s) => s.setWorldNumber)

  // `resolved` flips true once we've made a determination: either we found
  // a profile (in store/localStorage/Clerk) or we've waited for Clerk to
  // load and confirmed there's nothing there.
  const [resolved, setResolved] = useState(false)

  // ── Hydrate from the fastest available source ────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    // (a) Zustand already has it — we're done immediately.
    if (userProfile) {
      setResolved(true)
      return
    }

    // (b) localStorage — synchronous, runs on first tick.
    try {
      const saved = window.localStorage.getItem('mirai_profile')
      if (saved) {
        const parsed = JSON.parse(saved) as unknown
        if (isValidProfile(parsed)) {
          setUserProfile(parsed)
          setResolved(true)
          return
        }
      }
    } catch { /* ignore */ }

    // (c) Clerk metadata — only blocking path. Wait for it to load before
    //     declaring "no profile" so we don't bounce a returning user back
    //     through onboarding mid-handshake.
    if (isLoaded) {
      if (user) {
        const meta = user.unsafeMetadata as { worldNumber?: unknown; miraiProfile?: unknown } | undefined
        if (typeof meta?.worldNumber === 'number') setWorldNumber(meta.worldNumber)

        const metaProfile = meta?.miraiProfile
        if (isValidProfile(metaProfile)) {
          setUserProfile(metaProfile)
          // Mirror back to localStorage for instant boot next time.
          try {
            window.localStorage.setItem('mirai_profile', JSON.stringify(metaProfile))
          } catch { /* ignore */ }
        }
      }
      setResolved(true)
    }
    // If !isLoaded and no local data, we stay unresolved — the `/` route
    // will keep showing a splash until Clerk finishes.
  }, [isLoaded, user, userProfile, setUserProfile, setWorldNumber])

  // ── Routing ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!resolved) return

    const onAuthPage =
      pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')
    if (onAuthPage) return

    const hasProfile =
      userProfile != null ||
      !!window.localStorage.getItem('mirai_profile') ||
      isValidProfile(
        (user?.unsafeMetadata as { miraiProfile?: unknown } | undefined)
          ?.miraiProfile,
      )

    if (pathname === '/') {
      if (hasProfile) router.replace('/dashboard')
      return
    }

    if (!hasProfile) router.replace('/')
  }, [pathname, userProfile, router, resolved, user])

  // ── Render gate ──────────────────────────────────────────────────────
  // Only hold back the ONBOARDING page (`/`). Every other page is allowed
  // to render immediately — the guard handles its routing in the background.
  // This prevents the "returning user sees onboarding for 10s" flash
  // without making the rest of the app feel slow.
  if (pathname === '/' && !resolved) {
    return <Splash />
  }

  return <>{children}</>
}

function Splash() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#F5F0EB' }}
    >
      <div
        style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: '24px',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#bbead6',
          marginBottom: '16px',
        }}
      >
        KOMBU
      </div>
      <div
        className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{
          borderColor: '#bbead6',
          borderTopColor: 'transparent',
        }}
      />
    </div>
  )
}
