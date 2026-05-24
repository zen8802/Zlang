'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Route-level error boundary. Next.js App Router REQUIRES this file to live
 * at /app/error.tsx — without it, the dev server reports "missing required
 * error components, refreshing..." and gets stuck reloading.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('App error:', error)
    }
  }, [error])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: '#F5F0EB' }}
    >
      <div
        style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: '20px',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#bbead6',
          marginBottom: '32px',
        }}
      >
        KOMBU
      </div>

      <p
        style={{
          fontFamily: 'Shippori Mincho, serif',
          fontSize: '24px',
          color: '#1A1814',
          letterSpacing: '-0.01em',
        }}
      >
        Something went sideways
      </p>

      <p
        className="mt-2 max-w-sm"
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px',
          color: '#9E9892',
          lineHeight: 1.6,
        }}
      >
        We hit a snag rendering this page. Try again, or head back to the
        dashboard.
      </p>

      {process.env.NODE_ENV !== 'production' && error?.message && (
        <pre
          className="mt-4 max-w-xl text-left rounded-[8px] p-3 overflow-auto"
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '11px',
            color: '#8B3A3A',
            backgroundColor: '#F5EEEE',
            border: '1px solid #D4BABA',
            maxHeight: '200px',
          }}
        >
          {error.message}
        </pre>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-[10px] text-sm font-semibold text-white transition-all active:translate-y-px"
          style={{ backgroundColor: '#1B4F8A', fontFamily: 'DM Sans, sans-serif' }}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-[10px] text-sm font-medium transition-all border"
          style={{
            backgroundColor: '#FDFBF8',
            borderColor: '#E0DAD2',
            color: '#6B6560',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
