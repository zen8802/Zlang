import Link from 'next/link'

export default function NotFound() {
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
          fontSize: '56px',
          color: '#1B4F8A',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        404
      </p>

      <p
        className="mt-3"
        style={{
          fontFamily: 'Shippori Mincho, serif',
          fontSize: '20px',
          color: '#1A1814',
          letterSpacing: '-0.01em',
        }}
      >
        Nothing here
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
        This page doesn&apos;t exist — or it moved.
      </p>

      <Link
        href="/dashboard"
        className="mt-6 px-5 py-2.5 rounded-[10px] text-sm font-semibold text-white transition-all active:translate-y-px"
        style={{ backgroundColor: '#1B4F8A', fontFamily: 'DM Sans, sans-serif' }}
      >
        Back to dashboard
      </Link>
    </div>
  )
}
