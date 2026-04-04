'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, t } from '@/store/useAppStore'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

interface NavLink {
  key: string
  href: string
}

const navLinks: NavLink[] = [
  { key: 'nav.dashboard', href: '/dashboard' },
  { key: 'nav.lessons', href: '/lessons' },
  { key: 'nav.dojo', href: '/dojo' },
  { key: 'nav.humorLab', href: '/humor' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const streak = useAppStore((s) => s.streak)
  const xpToday = useAppStore((s) => s.xpToday)
  const uiLanguage = useAppStore((s) => s.uiLanguage)
  const setUiLanguage = useAppStore((s) => s.setUiLanguage)

  const toggleLanguage = useCallback(() => {
    setUiLanguage(uiLanguage === 'en' ? 'jp' : 'en')
  }, [uiLanguage, setUiLanguage])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <nav
      className="sticky top-0 z-40 w-full bg-black/[0.03] backdrop-blur-xl border-b border-black/[0.06]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* ---- Left: Logo ---- */}
          <Link
            href="/"
            className="flex items-center gap-1 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-lg"
          >
            <span className="font-display text-2xl font-bold text-accent text-glow tracking-tight">
              Zlang
            </span>
          </Link>

          {/* ---- Center: Desktop nav links ---- */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    'relative px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                    isActive
                      ? 'text-accent'
                      : 'text-foreground/60 hover:text-foreground hover:bg-black/[0.03]',
                  ].join(' ')}
                >
                  {t(link.key, uiLanguage)}
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 rounded-lg bg-accent/10 border border-accent/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* ---- Right: Stats & controls ---- */}
          <div className="hidden md:flex items-center gap-3">
            {/* Streak */}
            <div
              className="flex items-center gap-1 text-sm text-foreground/60"
              title={`${streak} day streak`}
            >
              <span role="img" aria-label="Streak">
                🔥
              </span>
              <span className="tabular-nums font-medium">{streak}</span>
            </div>

            {/* XP today */}
            <div
              className="flex items-center gap-1 text-sm text-foreground/60"
              title={`${xpToday} XP today`}
            >
              <span role="img" aria-label="XP today">
                ⚡
              </span>
              <span className="tabular-nums font-medium">{xpToday}</span>
            </div>

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-black/10 bg-black/[0.03] hover:bg-black/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              aria-label={`Switch language to ${uiLanguage === 'en' ? 'Japanese' : 'English'}`}
            >
              {uiLanguage === 'en' ? 'EN' : 'JP'}
            </button>

            {/* Settings */}
            <Link
              href="/settings"
              className="p-2 rounded-lg text-foreground/50 hover:text-foreground hover:bg-black/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              aria-label={t('nav.settings', uiLanguage)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>

            {/* Auth */}
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-xs font-medium text-foreground/50 hover:text-foreground transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#1B4F8A' }}
              >
                Sign up
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: { avatarBox: 'w-8 h-8' },
                }}
              />
            </SignedIn>
          </div>

          {/* ---- Mobile: Hamburger button ---- */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-black/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ---- Mobile menu dropdown ---- */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-black/[0.06]"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobile}
                    className={[
                      'block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'text-accent bg-accent/10'
                        : 'text-foreground/60 hover:text-foreground hover:bg-black/[0.03]',
                    ].join(' ')}
                  >
                    {t(link.key, uiLanguage)}
                  </Link>
                )
              })}

              {/* Mobile stats row */}
              <div className="flex items-center gap-4 pt-3 mt-2 border-t border-black/[0.06] px-4">
                <span className="flex items-center gap-1 text-sm text-foreground/60">
                  <span role="img" aria-label="Streak">🔥</span>
                  <span className="tabular-nums">{streak}</span>
                </span>
                <span className="flex items-center gap-1 text-sm text-foreground/60">
                  <span role="img" aria-label="XP today">⚡</span>
                  <span className="tabular-nums">{xpToday}</span>
                </span>
                <button
                  onClick={toggleLanguage}
                  className="px-3 py-1 rounded-lg text-xs font-semibold border border-black/10 bg-black/[0.03] hover:bg-black/[0.05] transition-colors"
                  aria-label={`Switch language to ${uiLanguage === 'en' ? 'Japanese' : 'English'}`}
                >
                  {uiLanguage === 'en' ? 'EN' : 'JP'}
                </button>
              </div>

              {/* Mobile settings link */}
              <Link
                href="/settings"
                onClick={closeMobile}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-black/[0.03] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                {t('nav.settings', uiLanguage)}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
