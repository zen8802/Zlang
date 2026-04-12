'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { VocabularyCard } from './VocabularyCard'
import Button from '@/components/ui/Button'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newUnlocks: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  strengthened: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mastered: any[]
  onContinue: () => void
}

export function CardUnlockReveal({ newUnlocks, strengthened, mastered, onContinue }: Props) {
  const router = useRouter()
  const [revealedCount, setRevealedCount] = useState(0)
  const [showSummary, setShowSummary] = useState(false)

  const maxReveal = Math.min(3, newUnlocks.length)
  const hasAnything = newUnlocks.length > 0 || strengthened.length > 0 || mastered.length > 0

  useEffect(() => {
    if (!hasAnything) {
      setShowSummary(true)
      return
    }

    if (maxReveal === 0) {
      const t = setTimeout(() => setShowSummary(true), 400)
      return () => clearTimeout(t)
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < maxReveal; i++) {
      const delay = 400 + i * 800
      timers.push(
        setTimeout(() => {
          setRevealedCount(i + 1)
        }, delay)
      )
    }
    const summaryDelay = 400 + maxReveal * 800 + 600
    timers.push(setTimeout(() => setShowSummary(true), summaryDelay))

    return () => {
      timers.forEach((t) => clearTimeout(t))
    }
  }, [maxReveal, hasAnything])

  const cardSize: 'sm' | 'md' | 'lg' =
    newUnlocks.length === 1 ? 'lg' : newUnlocks.length === 2 ? 'md' : 'sm'

  if (!hasAnything) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#F5F0EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: '"Shippori Mincho", serif',
              fontSize: 22,
              color: '#1A1A1A',
              marginBottom: 24,
            }}
          >
            No new cards this session — try using more Japanese!
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={onContinue}>
            Continue →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F0EB',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: 640, width: '100%', marginTop: 32 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            className="text-[10px] tracking-widest uppercase"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              color: '#8A8478',
              marginBottom: 8,
            }}
          >
            New cards
          </div>
          <div
            style={{
              fontFamily: '"Shippori Mincho", serif',
              fontSize: 22,
              color: '#1A1A1A',
            }}
          >
            {newUnlocks.length} word{newUnlocks.length === 1 ? '' : 's'} collected
          </div>
        </div>

        {/* Cards row */}
        <div className="flex justify-center gap-3 flex-wrap" style={{ marginBottom: 32 }}>
          {newUnlocks.slice(0, maxReveal).map((card, idx) => {
            const isRevealed = idx < revealedCount
            return (
              <div
                key={card.id ?? idx}
                style={{
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s, transform 0.5s',
                }}
              >
                <VocabularyCard
                  card={card}
                  userCard={{
                    status: 'heard',
                    encounterCount: 1,
                    productionCount: card.wasProduced ? 1 : 0,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ...({ recognitionCount: card.wasProduced ? 0 : 1 } as any),
                    firstEncounteredAt: new Date().toISOString(),
                    contexts: [],
                  }}
                  size={cardSize}
                  isNew={true}
                />
              </div>
            )
          })}
        </div>

        {/* +X more */}
        {showSummary && newUnlocks.length > maxReveal && (
          <div
            className="ink-in"
            style={{
              textAlign: 'center',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: '#6B6459',
              marginBottom: 24,
            }}
          >
            +{newUnlocks.length - maxReveal} more collected
          </div>
        )}

        {/* Mastered callout */}
        {showSummary && mastered.length > 0 && (
          <div
            className="ink-in bg-[#FEF3C7] border-[#F59E0B]"
            style={{
              border: '2px solid',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: '"Shippori Mincho", serif',
                fontSize: 16,
                color: '#8A6D2C',
                marginBottom: 6,
              }}
            >
              ⭐ {mastered.length} word{mastered.length === 1 ? '' : 's'} mastered
            </div>
            <div
              style={{
                fontFamily: '"Noto Sans JP", sans-serif',
                fontSize: 14,
                color: '#6B5320',
              }}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {mastered.map((c: any) => c.word).join(', ')}
            </div>
          </div>
        )}

        {/* Summary stats */}
        {showSummary && (
          <div
            className="ink-in"
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
              border: '1px solid #E0DAD2',
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div
                style={{
                  fontFamily: '"Shippori Mincho", serif',
                  fontSize: 20,
                  color: '#1B4F8A',
                }}
              >
                {newUnlocks.length}
              </div>
              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  color: '#6B6459',
                  marginTop: 2,
                }}
              >
                New
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div
                style={{
                  fontFamily: '"Shippori Mincho", serif',
                  fontSize: 20,
                  color: '#4A9D7F',
                }}
              >
                {strengthened.length}
              </div>
              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  color: '#6B6459',
                  marginTop: 2,
                }}
              >
                Strengthened
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div
                style={{
                  fontFamily: '"Shippori Mincho", serif',
                  fontSize: 20,
                  color: '#C9A961',
                }}
              >
                {mastered.length}
              </div>
              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  color: '#6B6459',
                  marginTop: 2,
                }}
              >
                Mastered
              </div>
            </div>
          </div>
        )}

        {/* Continue button */}
        {showSummary && (
          <div className="ink-in">
            <Button variant="primary" size="lg" fullWidth onClick={onContinue}>
              Continue →
            </Button>
            <button
              onClick={() => router.push('/collection')}
              style={{
                width: '100%',
                marginTop: 12,
                background: 'transparent',
                border: 'none',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                color: '#6B6459',
                cursor: 'pointer',
                padding: 8,
              }}
            >
              View your collection →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CardUnlockReveal
