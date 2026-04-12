'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecentCard = any

interface RecentData {
  collected: number
  total: number
  mastered: number
  recentCards: RecentCard[]
}

export default function CollectionWidget() {
  const router = useRouter()
  const [stats, setStats] = useState<RecentData | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch('/api/collection/recent')
      .then((r) => r.json())
      .then((data: RecentData) => setStats(data))
      .catch(() => setFailed(true))
  }, [])

  if (failed) return null
  if (!stats) return null
  if (stats.collected === 0) return null

  const pct = stats.total > 0 ? Math.min(100, (stats.collected / stats.total) * 100) : 0
  const previews = (stats.recentCards || []).slice(0, 3)

  return (
    <button
      onClick={() => router.push('/collection')}
      className="w-full bg-[#FDFBF8] rounded-[10px] p-4 mb-4 text-left cursor-pointer transition-all duration-150 hover:shadow-[0_2px_12px_rgba(26,24,20,0.08)] active:translate-y-px"
      style={{
        border: '1px solid #E0DAD2',
        boxShadow: '0 1px 4px rgba(26,24,20,0.06)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p
            style={{
              fontFamily: 'DM Sans',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#9E9892',
            }}
          >
            Word Collection
          </p>
          <p
            style={{
              fontFamily: 'Shippori Mincho',
              fontSize: '20px',
              color: '#1A1814',
              letterSpacing: '-0.01em',
            }}
          >
            {stats.collected}
            <span style={{ fontSize: '13px', color: '#9E9892' }}> / 2000</span>
          </p>
        </div>

        <div className="flex items-center gap-1">
          {previews.map((c, i) => (
            <div
              key={c?.id ?? i}
              className="w-10 h-14 rounded-[6px] flex flex-col items-center justify-center"
              style={{
                backgroundColor: c?.cardColor || '#EBF0F8',
                transform: `rotate(${(i - 1) * 3}deg)`,
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <span style={{ fontSize: '14px' }}>{c?.cardEmoji || '✨'}</span>
              <span
                style={{
                  fontFamily: 'Noto Sans JP',
                  fontSize: '10px',
                  color: '#FFFFFF',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  maxWidth: '36px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c?.word || ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full h-[3px] rounded-full overflow-hidden bg-[#E0DAD2]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: '#1B4F8A',
          }}
        />
      </div>

      {stats.mastered > 0 && (
        <p
          className="mt-2"
          style={{
            fontFamily: 'DM Sans',
            fontSize: '10px',
            color: '#F59E0B',
          }}
        >
          ⭐ {stats.mastered} mastered · tap to see your collection
        </p>
      )}
    </button>
  )
}

export { CollectionWidget }
