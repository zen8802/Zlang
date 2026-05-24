'use client'

/**
 * Catastrophic-error fallback. Wraps the entire app (including html/body)
 * for errors that bubble past the route-level error.tsx. Cannot use
 * components from /components since the regular layout is unavailable here.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#F5F0EB', minHeight: '100vh' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: '"Shippori Mincho", serif',
              fontSize: '22px',
              color: '#1A1814',
              margin: 0,
            }}
          >
            Kombu hit a wall
          </p>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '13px',
              color: '#9E9892',
              marginTop: '8px',
              maxWidth: '360px',
              lineHeight: 1.6,
            }}
          >
            Something failed before we could draw the page. Try refreshing.
          </p>
          {process.env.NODE_ENV !== 'production' && error?.message && (
            <pre
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#8B3A3A',
                backgroundColor: '#F5EEEE',
                border: '1px solid #D4BABA',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '16px',
                maxWidth: '600px',
                overflowX: 'auto',
                textAlign: 'left',
              }}
            >
              {error.message}
            </pre>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: '24px',
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: '#1B4F8A',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
