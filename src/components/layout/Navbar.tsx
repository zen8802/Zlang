'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore, t } from '@/store/useAppStore'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import XPPill from '@/components/ui/XPPill'
import StreakPill from '@/components/ui/StreakPill'

interface NavLink {
  key: string
  href: string
}

const navLinks: NavLink[] = [
  { key: 'nav.dashboard', href: '/dashboard' },
  { key: 'nav.lessons', href: '/lessons' },
  { key: 'nav.share', href: '/share' },
  { key: 'nav.studio', href: '/studio' },
]

export default function Navbar() {
  const pathname = usePathname()

  const streak = useAppStore((s) => s.streak)
  const xpToday = useAppStore((s) => s.xpToday)
  const uiLanguage = useAppStore((s) => s.uiLanguage)
  const setUiLanguage = useAppStore((s) => s.setUiLanguage)

  const toggleLanguage = useCallback(() => {
    setUiLanguage(uiLanguage === 'en' ? 'jp' : 'en')
  }, [uiLanguage, setUiLanguage])

  return (
    <>
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#F5F0EB', boxShadow: '0 2px 0 rgba(0,0,0,0.04)' }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-black" style={{ fontFamily: 'Noto Sans JP', color: '#1B4F8A' }}>未来</span>
          <span className="text-xs font-bold tracking-[0.2em]" style={{ color: '#9CA3AF' }}>ZLANG</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
            return (
              <Link key={link.key} href={link.href} className={`px-4 py-2 rounded-[12px] text-sm font-bold transition-all ${isActive ? 'bg-[#EBF0F8] text-[#1B4F8A]' : 'text-[#6B7280] hover:text-[#1A1A2E] hover:bg-gray-50'}`} style={{ fontFamily: 'Nunito' }}>
                {t(link.key, uiLanguage)}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <StreakPill streak={streak} />
          <XPPill xp={xpToday} />

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="hidden md:inline-flex px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all hover:bg-[#EBF0F8]"
            style={{ color: '#6B7280', fontFamily: 'Nunito' }}
            aria-label={`Switch language to ${uiLanguage === 'en' ? 'Japanese' : 'English'}`}
          >
            {uiLanguage === 'en' ? 'EN' : 'JP'}
          </button>

          {/* Clerk auth */}
          <SignedOut>
            <Link href="/sign-in" className="text-xs font-bold ml-2" style={{ color: '#6B7280', fontFamily: 'Nunito' }}>Log in</Link>
            <Link href="/sign-up" className="text-xs font-bold text-white px-3 py-1.5 rounded-[10px] ml-1 shadow-[0_2px_0_#133970]" style={{ backgroundColor: '#1B4F8A', fontFamily: 'Nunito' }}>Sign up</Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-8 h-8 ml-2' } }} />
          </SignedIn>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 pb-[env(safe-area-inset-bottom)]" style={{ boxShadow: '0 -2px 12px rgba(0,0,0,0.06)' }}>
        <div className="flex justify-around px-2 py-2">
          {[
            { key: 'nav.dashboard', href: '/dashboard', icon: '🏠', label: t('nav.dashboard', uiLanguage) },
            { key: 'nav.lessons', href: '/lessons', icon: '📚', label: t('nav.lessons', uiLanguage) },
            { key: 'nav.share', href: '/share', icon: '🎬', label: t('nav.share', uiLanguage) },
            { key: 'nav.studio', href: '/studio', icon: '🎭', label: t('nav.studio', uiLanguage) },
          ].map(item => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link key={item.key} href={item.href} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-[16px] transition-all duration-150 min-w-[60px] ${isActive ? 'bg-[#EBF0F8] text-[#1B4F8A]' : 'text-gray-400 hover:text-gray-600'}`}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-bold" style={{ fontFamily: 'Nunito' }}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
