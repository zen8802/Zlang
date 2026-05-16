'use client'

import { useEffect, useRef, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'

/**
 * Custom user avatar + dropdown. Replaces Clerk's default <UserButton> so we
 * can:
 *   - Show /mascot/neutral.png as the avatar when the user hasn't uploaded one
 *     (Clerk's default is a generated initials gradient that clashes with the
 *     paper aesthetic).
 *   - Show the user's uploaded image when they have one (`user.hasImage`).
 *   - Open Clerk's profile modal for avatar upload + account management.
 *   - Sign out.
 *
 * The dropdown closes on outside click and Escape.
 */
export default function UserMenu() {
  const { user, isLoaded } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  if (!isLoaded || !user) return null

  // Prefer the user's uploaded image. Fall back to the Kombu mascot so the
  // default isn't a generated Clerk initials gradient.
  const avatarSrc = user.hasImage && user.imageUrl ? user.imageUrl : '/mascot/neutral.png'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open user menu"
        className="w-8 h-8 rounded-full overflow-hidden border border-[#E0DAD2] hover:border-[#1B4F8A]/40 transition-colors"
        style={{ backgroundColor: '#FDFBF8' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt={user.username || 'You'}
          className="w-full h-full object-cover"
        />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-[12px] overflow-hidden"
          style={{
            backgroundColor: '#FDFBF8',
            border: '1px solid #E0DAD2',
            boxShadow: '0 8px 24px rgba(26,24,20,0.12)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#F5F0EB]">
            <p
              className="truncate"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1A1814',
              }}
            >
              {user.username || user.firstName || 'Signed in'}
            </p>
            <p
              className="truncate"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '11px',
                color: '#9E9892',
              }}
            >
              {user.primaryEmailAddress?.emailAddress || ''}
            </p>
          </div>

          {/* Actions */}
          <button
            onClick={() => {
              setOpen(false)
              openUserProfile()
            }}
            className="w-full text-left px-4 py-2.5 hover:bg-[#F5F0EB] transition-colors"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#1A1814',
            }}
          >
            Manage account
          </button>
          <button
            onClick={() => {
              setOpen(false)
              signOut({ redirectUrl: '/' })
            }}
            className="w-full text-left px-4 py-2.5 hover:bg-[#F5EEEE] transition-colors"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#8B3A3A',
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
