'use client'

import { useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore, t } from '@/store/useAppStore'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

interface NavLink {
  key: string
  href: string
}

const navLinks: NavLink[] = [
  { key: 'nav.dashboard', href: '/dashboard' },
  { key: 'nav.collection', href: '/collection' },
]

export default function Navbar() {
  const pathname = usePathname()

  const loginStreak = useAppStore((s) => s.loginStreak)
  const uiLanguage = useAppStore((s) => s.uiLanguage)
  const setUiLanguage = useAppStore((s) => s.setUiLanguage)
  const registerLogin = useAppStore((s) => s.registerLogin)

  // Stamp today's login on first mount of any authenticated screen.
  useEffect(() => {
    registerLogin()
  }, [registerLogin])

  const toggleLanguage = useCallback(() => {
    setUiLanguage(uiLanguage === 'en' ? 'jp' : 'en')
  }, [uiLanguage, setUiLanguage])

  return (
    <>
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between bg-[#FDFBF8] border-b border-[#E0DAD2]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span
            className="font-semibold"
            style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '20px', color: '#1B4F8A' }}
          >
            未来
          </span>
          <span
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', letterSpacing: '0.15em', color: '#9E9892' }}
          >
            MIRAI
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname?.startsWith(link.href + '/')
            return (
              <Link
                key={link.key}
                href={link.href}
                className={`px-4 py-2 rounded-[6px] text-sm font-bold transition-all ${
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

        <div className="flex items-center gap-2">
          {/* Daily login streak */}
          <span
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#6B6560' }}
            title="Daily login streak"
          >
            {loginStreak}日
          </span>

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="hidden md:inline-flex px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all hover:bg-[#EBF0F8]"
            style={{ color: '#6B6560', fontFamily: 'DM Sans, sans-serif' }}
            aria-label={`Switch language to ${uiLanguage === 'en' ? 'Japanese' : 'English'}`}
          >
            {uiLanguage === 'en' ? 'EN' : 'JP'}
          </button>

          {/* Clerk auth */}
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-xs font-bold ml-2"
              style={{ color: '#6B6560', fontFamily: 'DM Sans, sans-serif' }}
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="text-xs font-bold text-white px-3 py-1.5 rounded-[8px] ml-1"
              style={{ backgroundColor: '#1B4F8A', fontFamily: 'DM Sans, sans-serif' }}
            >
              Sign up
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-8 h-8 ml-2' } }} />
          </SignedIn>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FDFBF8] border-t border-[#E0DAD2] z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around px-2 py-2">
          {[
            { key: 'nav.dashboard', href: '/dashboard', icon: '🏠', label: t('nav.dashboard', uiLanguage) },
            { key: 'nav.collection', href: '/collection', icon: '📖', label: t('nav.collection', uiLanguage) },
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
                <span className="text-xl">{item.icon}</span>
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
