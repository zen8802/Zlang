'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAppStore, t } from '@/store/useAppStore'
import { SignedIn, SignedOut, useUser } from '@clerk/nextjs'
import UserMenu from './UserMenu'

interface NavLink {
  key: string
  href: string
}

const navLinks: NavLink[] = [
  { key: 'nav.dashboard', href: '/dashboard' },
  { key: 'nav.collection', href: '/collection' },
  { key: 'nav.saved', href: '/saved-lessons' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()

  const displayName =
    (isLoaded && user?.username) ||
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    ''

  const uiLanguage = useAppStore((s) => s.uiLanguage)
  const registerLogin = useAppStore((s) => s.registerLogin)

  // Stamp today's login on first mount of any authenticated screen.
  useEffect(() => {
    registerLogin()
  }, [registerLogin])

  return (
    <>
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between bg-[#FDFBF8] border-b border-[#E0DAD2]">
        {/* Left: KOMBU wordmark + nav links */}
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="flex items-center">
            <span
              style={{
                fontFamily: 'Geist, sans-serif',
                fontSize: '22px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#bbead6',
              }}
            >
              KOMBU
            </span>
          </Link>

          {/* Desktop nav — sits flush against the wordmark */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname?.startsWith(link.href + '/')
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  className={`px-3 py-2 rounded-[6px] text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#EBF0F8] text-[#1B4F8A]'
                      : 'text-[#6B6560] hover:text-[#1A1814] hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {t(link.key, uiLanguage)}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right: greeting + settings + user menu */}
        <div className="flex items-center gap-3">
          <SignedIn>
            {displayName && (
              <p
                className="hidden sm:inline-flex items-baseline gap-1.5"
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#1A1814' }}
              >
                <span style={{ fontFamily: 'Noto Sans JP', fontWeight: 400 }}>
                  こんにちは,
                </span>
                <span style={{ fontWeight: 700 }}>{displayName}</span>
              </p>
            )}

            {/* Settings gear — houses user settings */}
            <Link
              href="/settings"
              aria-label="Settings"
              className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] transition-all hover:bg-[#EBF0F8]"
              style={{ color: '#6B6560' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>

            {/* Custom user menu — neutral.png default avatar + Clerk profile + sign out */}
            <UserMenu />
          </SignedIn>

          <SignedOut>
            <Link
              href="/sign-in"
              className="text-xs font-bold"
              style={{ color: '#6B6560', fontFamily: 'DM Sans, sans-serif' }}
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="text-xs font-bold text-white px-3 py-1.5 rounded-[8px]"
              style={{ backgroundColor: '#1B4F8A', fontFamily: 'DM Sans, sans-serif' }}
            >
              Sign up
            </Link>
          </SignedOut>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FDFBF8] border-t border-[#E0DAD2] z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around px-2 py-2">
          {[
            { key: 'nav.dashboard', href: '/dashboard', icon: '🏠', image: null, label: t('nav.dashboard', uiLanguage) },
            { key: 'nav.collection', href: '/collection', icon: null, image: '/CollectionLogo.png', label: t('nav.collection', uiLanguage) },
            { key: 'nav.saved', href: '/saved-lessons', icon: '📚', image: null, label: t('nav.saved', uiLanguage) },
          ].map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-[10px] transition-all duration-150 min-w-[60px] ${
                  isActive ? 'text-[#1B4F8A]' : 'text-[#9E9892] hover:text-[#6B6560]'
                }`}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.label}
                    width={24}
                    height={24}
                    className={`w-6 h-6 rounded-[4px] object-cover ${isActive ? 'opacity-100' : 'opacity-60'}`}
                  />
                ) : (
                  <span className="text-xl">{item.icon}</span>
                )}
                <span className="text-[10px] font-bold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
