'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import VocabularyCard from '@/components/collection/VocabularyCard'

const DOMAIN_META: Record<
  string,
  { label: string; emoji: string; color: string; description: string }
> = {
  grammar: {
    label: 'Grammar',
    emoji: '⚙️',
    color: '#4A7AB5',
    description: 'Particles, conjunctions, expressions',
  },
  food: {
    label: 'Food',
    emoji: '🍜',
    color: '#FF6B35',
    description: 'Ordering, describing, enjoying',
  },
  social: {
    label: 'Social',
    emoji: '🤝',
    color: '#FF6B9D',
    description: 'Greetings, feelings, relationships',
  },
  transport: {
    label: 'Transport',
    emoji: '🚉',
    color: '#2D3748',
    description: 'Getting around, directions',
  },
  'daily-life': {
    label: 'Daily life',
    emoji: '🏠',
    color: '#2EC4B6',
    description: 'Shopping, admin, errands',
  },
  work: {
    label: 'Work',
    emoji: '💼',
    color: '#6B6560',
    description: 'Business, professional, office',
  },
  body: {
    label: 'Body',
    emoji: '🏥',
    color: '#E63946',
    description: 'Medical, physical, wellness',
  },
  culture: {
    label: 'Culture',
    emoji: '⛩️',
    color: '#8B5CF6',
    description: 'Traditions, arts, entertainment',
  },
  nature: {
    label: 'Nature',
    emoji: '🌸',
    color: '#3D6B4F',
    description: 'Weather, seasons, environment',
  },
  numbers: {
    label: 'Numbers',
    emoji: '🔢',
    color: '#7A5C2E',
    description: 'Counting, dates, schedules',
  },
}

interface DomainProgress {
  domain: string
  total: number
  collected: number
  mastered: number
}

interface TotalStats {
  collected: number
  total: number
  mastered: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DomainCardEntry = { card: any; userCard: any }

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function CollectionPage() {
  const router = useRouter()
  const [domainProgress, setDomainProgress] = useState<DomainProgress[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [domainCards, setDomainCards] = useState<DomainCardEntry[]>([])
  const [totalStats, setTotalStats] = useState<TotalStats>({
    collected: 0,
    total: 0,
    mastered: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/collection/progress')
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => {
        setDomainProgress(data.domains || [])
        setTotalStats(
          data.total || { collected: 0, total: 0, mastered: 0 }
        )
      })
      .catch(() => {
        setDomainProgress([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedDomain) return
    fetch(`/api/collection/domain/${selectedDomain}`)
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => setDomainCards(data.cards || []))
      .catch(() => setDomainCards([]))
  }, [selectedDomain])

  const overallPct =
    totalStats.total > 0
      ? Math.min(100, (totalStats.collected / totalStats.total) * 100)
      : 0

  const allEmpty = domainProgress.every((d) => d.collected === 0)

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F5F0EB' }}>
      {/* Header */}
      <header
        className="px-6 pt-10 pb-4"
        style={{ backgroundColor: '#F5F0EB' }}
      >
        <p
          style={{
            fontFamily: 'DM Sans',
            fontSize: '10px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#9E9892',
          }}
        >
          Your Collection
        </p>
        <h1
          style={{
            fontFamily: 'Shippori Mincho',
            fontSize: '28px',
            color: '#1A1814',
            letterSpacing: '-0.02em',
            marginTop: '2px',
          }}
        >
          言葉コレクション
        </h1>

        <div className="flex justify-between items-center mt-4 mb-2">
          <span
            style={{
              fontFamily: 'DM Sans',
              fontSize: '12px',
              color: '#6B6560',
            }}
          >
            {totalStats.collected} / {totalStats.total} words
          </span>
          <span
            style={{
              fontFamily: 'DM Sans',
              fontSize: '12px',
              color: '#F59E0B',
            }}
          >
            ⭐ {totalStats.mastered} mastered
          </span>
        </div>
        <div className="w-full h-[6px] rounded-full overflow-hidden bg-[#E0DAD2]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${overallPct}%`,
              backgroundColor: '#1B4F8A',
            }}
          />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4">
        {loading ? (
          <p
            className="text-center py-10"
            style={{ fontFamily: 'DM Sans', color: '#9E9892' }}
          >
            Loading…
          </p>
        ) : selectedDomain === null ? (
          allEmpty ? (
            <div className="text-center py-16 animate-[ink-in_0.6s_ease-out]">
              <div className="text-5xl mb-4">📦</div>
              <h2
                style={{
                  fontFamily: 'Shippori Mincho',
                  fontSize: '20px',
                  color: '#1A1814',
                  marginBottom: '8px',
                }}
              >
                Your collection is empty
              </h2>
              <p
                className="mb-6"
                style={{
                  fontFamily: 'DM Sans',
                  fontSize: '14px',
                  color: '#9E9892',
                }}
              >
                Complete your first conversation to start collecting words
              </p>
              <div className="flex justify-center">
                <Button
                  variant="primary"
                  onClick={() => router.push('/dashboard')}
                >
                  Start a conversation →
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {domainProgress.map((d) => {
                const meta = DOMAIN_META[d.domain] || {
                  label: d.domain,
                  emoji: '📘',
                  color: '#6B6560',
                  description: '',
                }
                const pct =
                  d.total > 0 ? Math.min(100, (d.collected / d.total) * 100) : 0
                let barColor = 'transparent'
                if (pct >= 80) barColor = '#3D6B4F'
                else if (pct >= 40) barColor = '#1B4F8A'
                else if (pct > 0) barColor = '#9E9892'

                return (
                  <button
                    key={d.domain}
                    onClick={() => setSelectedDomain(d.domain)}
                    className="w-full bg-[#FDFBF8] rounded-[10px] p-4 text-left cursor-pointer transition-all duration-150 hover:shadow-[0_2px_12px_rgba(26,24,20,0.08)] active:translate-y-px"
                    style={{
                      border: '1px solid #E0DAD2',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = hexToRgba(
                        '#1B4F8A',
                        0.3
                      )
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E0DAD2'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: hexToRgba(meta.color, 0.12),
                          fontSize: '22px',
                        }}
                      >
                        {meta.emoji}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span
                            style={{
                              fontFamily: 'Shippori Mincho',
                              fontWeight: 600,
                              fontSize: '15px',
                              color: '#1A1814',
                            }}
                          >
                            {meta.label}
                          </span>
                          <span
                            style={{
                              fontFamily: 'DM Sans',
                              fontSize: '12px',
                              color: '#6B6560',
                            }}
                          >
                            {d.collected}/{d.total}
                          </span>
                        </div>
                        <div className="w-full h-[3px] rounded-full overflow-hidden bg-[#E0DAD2] mb-1">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span
                            style={{
                              fontFamily: 'DM Sans',
                              fontSize: '10px',
                              color: '#9E9892',
                            }}
                          >
                            {d.collected === 0
                              ? `Not started — find scenarios with ${meta.emoji}`
                              : meta.description}
                          </span>
                          {d.mastered > 0 && (
                            <span
                              style={{
                                fontFamily: 'DM Sans',
                                fontSize: '10px',
                                color: '#F59E0B',
                              }}
                            >
                              ⭐ {d.mastered}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className="shrink-0"
                        style={{ color: '#C8C3BC', fontSize: '18px' }}
                      >
                        →
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        ) : (
          <div>
            <button
              onClick={() => {
                setSelectedDomain(null)
                setDomainCards([])
              }}
              className="mb-4 cursor-pointer transition-colors"
              style={{
                fontFamily: 'DM Sans',
                fontSize: '13px',
                color: '#6B6560',
              }}
            >
              ← All domains
            </button>

            {(() => {
              const meta = DOMAIN_META[selectedDomain] || {
                label: selectedDomain,
                emoji: '📘',
                color: '#6B6560',
                description: '',
              }
              return (
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{meta.emoji}</span>
                  <div>
                    <h2
                      style={{
                        fontFamily: 'Shippori Mincho',
                        fontSize: '20px',
                        color: '#1A1814',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {meta.label}
                    </h2>
                    <p
                      style={{
                        fontFamily: 'DM Sans',
                        fontSize: '12px',
                        color: '#9E9892',
                      }}
                    >
                      {meta.description}
                    </p>
                  </div>
                </div>
              )
            })()}

            <div className="flex flex-wrap gap-3 justify-center">
              {domainCards.map((entry, i) => (
                <VocabularyCard
                  key={entry.card?.id ?? i}
                  card={entry.card}
                  userCard={entry.userCard}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
