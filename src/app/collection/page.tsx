'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { HIRAGANA_GRID, KATAKANA_GRID, ROW_LABELS, COL_LABELS } from '@/data/hiragana-grid'
import type { KanaCell } from '@/data/hiragana-grid'
import { GRADE_1_KANJI } from '@/data/kyouiku-kanji'
import HiraganaGridView from '@/components/collection/HiraganaGridView'
import CharacterDetailPanel from '@/components/collection/CharacterDetailPanel'
import PhrasesGridView from '@/components/collection/PhrasesGridView'
import KanjiGridView from '@/components/collection/KanjiGridView'

type TabKey = 'kana' | 'phrases' | 'kanji'
type KanaMode = 'hiragana' | 'katakana'

const grade1Set = new Set(GRADE_1_KANJI.map((k) => k.character))

export default function CollectionPage() {
  const router = useRouter()
  const discoveredHiragana = useAppStore((s) => s.discoveredHiragana)
  const discoveredKatakana = useAppStore((s) => s.discoveredKatakana)
  const discoveredKanjiArray = useAppStore((s) => s.discoveredKanji)
  const userProfile = useAppStore((s) => s.userProfile)

  const [activeTab, setActiveTab] = useState<TabKey>('kana')
  const [kanaMode, setKanaMode] = useState<KanaMode>('hiragana')
  const [selectedChar, setSelectedChar] = useState<KanaCell | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [wordsByCategory, setWordsByCategory] = useState<Record<string, { card: any; userCard: any | null }[]>>({})
  const [seenHiragana, setSeenHiragana] = useState<Set<string>>(new Set())
  const [seenKatakana, setSeenKatakana] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const tabBarRef = useRef<HTMLDivElement>(null)

  // Fetch words data
  useEffect(() => {
    fetch('/api/collection/all')
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => {
        setWordsByCategory(data.wordsByCategory || {})
        setSeenHiragana(new Set(data.hiraganaSeen || []))
        setSeenKatakana(new Set(data.katakanaSeen || []))
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const discoveredHSet = useMemo(() => new Set(discoveredHiragana), [discoveredHiragana])
  const discoveredKSet = useMemo(() => new Set(discoveredKatakana), [discoveredKatakana])
  const discoveredKanjiSet = useMemo(() => new Set(discoveredKanjiArray), [discoveredKanjiArray])

  const katakanaLocked = discoveredHiragana.length < 46

  // Tab progress counts
  const kanaCount = discoveredHiragana.length + discoveredKatakana.length
  const phrases = wordsByCategory['expression'] || []
  const phrasesCollected = phrases.filter((e) => e.userCard !== null).length
  const kanjiDiscoveredCount = discoveredKanjiArray.filter((k) => grade1Set.has(k)).length

  const totalDiscovered = kanaCount + phrasesCollected + kanjiDiscoveredCount

  // Character detail panel
  const selectedCharDiscovered = useMemo(() => {
    if (!selectedChar) return false
    if (kanaMode === 'katakana') return discoveredKSet.has(selectedChar.character)
    return discoveredHSet.has(selectedChar.character)
  }, [selectedChar, kanaMode, discoveredHSet, discoveredKSet])

  const tabs: { key: TabKey; label: string; count: string }[] = [
    { key: 'kana', label: 'Kana', count: `${kanaCount}/92` },
    { key: 'kanji', label: 'Kanji', count: `${kanjiDiscoveredCount}/80` },
    { key: 'phrases', label: 'Phrases', count: `${phrasesCollected}/${phrases.length}` },
  ]

  const activeTabIndex = tabs.findIndex((t) => t.key === activeTab)

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F5F0EB' }}>
      {/* Sticky header */}
      <header
        className="sticky top-0 z-20 px-6 pt-10 pb-0"
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
        <div className="flex justify-between items-baseline">
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
          <span
            style={{
              fontFamily: 'DM Sans',
              fontSize: '12px',
              color: '#6B6560',
            }}
          >
            {totalDiscovered} discovered
          </span>
        </div>

        {/* Tab bar */}
        <div ref={tabBarRef} className="relative mt-4">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setSelectedChar(null)
                }}
                className="flex-1 pb-3 pt-1 text-center cursor-pointer transition-colors"
              >
                <span
                  style={{
                    fontFamily: 'DM Sans',
                    fontSize: '13px',
                    fontWeight: activeTab === tab.key ? 700 : 500,
                    color: activeTab === tab.key ? '#1B4F8A' : '#9E9892',
                  }}
                >
                  {tab.label}
                </span>
                <span
                  className="ml-1"
                  style={{
                    fontFamily: 'DM Mono',
                    fontSize: '10px',
                    color: activeTab === tab.key ? '#1B4F8A' : '#C8C3BC',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sliding underline */}
          <div
            className="absolute bottom-0 h-[2px] rounded-full transition-all duration-300"
            style={{
              backgroundColor: '#1B4F8A',
              width: `${100 / tabs.length}%`,
              left: `${(activeTabIndex * 100) / tabs.length}%`,
            }}
          />
        </div>
      </header>

      {/* Grammar Reference pill */}
      <div className="max-w-lg mx-auto px-4 pt-3">
        <button
          onClick={() => alert('Coming soon!')}
          className="rounded-full px-4 py-1.5 cursor-pointer transition-colors"
          style={{
            backgroundColor: 'rgba(27, 79, 138, 0.06)',
            border: '1px solid rgba(27, 79, 138, 0.12)',
          }}
        >
          <span
            style={{
              fontFamily: 'DM Sans',
              fontSize: '12px',
              fontWeight: 600,
              color: '#1B4F8A',
            }}
          >
            📖 Grammar Reference
          </span>
        </button>
      </div>

      {/* Tab content */}
      <main className="max-w-lg mx-auto px-4 pt-2">
        {activeTab === 'kana' && (
          <>
            {/* Hiragana / Katakana segmented control */}
            <div className="flex gap-1 mb-3 p-1 rounded-[10px]" style={{ backgroundColor: '#E8E3DD' }}>
              {(['hiragana', 'katakana'] as KanaMode[]).map((mode) => {
                const isActive = kanaMode === mode
                const isLocked = mode === 'katakana' && katakanaLocked
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      if (isLocked) return
                      setKanaMode(mode)
                      setSelectedChar(null)
                    }}
                    className={`flex-1 py-1.5 rounded-[8px] text-center cursor-pointer transition-all ${
                      isLocked ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? '#FDFBF8' : 'transparent',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'DM Sans',
                        fontSize: '12px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#1B4F8A' : '#9E9892',
                      }}
                    >
                      {mode === 'hiragana' ? 'Hiragana' : 'Katakana'}
                    </span>
                    {isLocked && (
                      <span className="ml-1" style={{ fontSize: '10px' }}>
                        🔒
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {kanaMode === 'hiragana' && (
              <HiraganaGridView
                grid={HIRAGANA_GRID}
                discovered={discoveredHSet}
                seen={seenHiragana}
                rowLabels={ROW_LABELS}
                colLabels={COL_LABELS}
                selectedChar={selectedChar}
                onSelectChar={setSelectedChar}
                isAbsoluteBeginner={discoveredHiragana.length === 0}
              />
            )}

            {kanaMode === 'katakana' && !katakanaLocked && (
              <HiraganaGridView
                grid={KATAKANA_GRID}
                discovered={discoveredKSet}
                seen={seenKatakana}
                rowLabels={ROW_LABELS}
                colLabels={COL_LABELS}
                selectedChar={selectedChar}
                onSelectChar={setSelectedChar}
                isAbsoluteBeginner={discoveredKatakana.length === 0}
                isKatakana
              />
            )}
          </>
        )}

        {activeTab === 'phrases' && (
          <>
            {loading ? (
              <p
                className="text-center py-10"
                style={{ fontFamily: 'DM Sans', color: '#9E9892' }}
              >
                Loading...
              </p>
            ) : (
              <PhrasesGridView phrases={phrases} />
            )}
          </>
        )}

        {activeTab === 'kanji' && (
          <KanjiGridView
            grade1Kanji={GRADE_1_KANJI}
            discoveredKanji={discoveredKanjiSet}
            userExperience={userProfile?.experience || 1}
          />
        )}
      </main>

      {/* Character detail panel */}
      {selectedChar && activeTab === 'kana' && (
        <CharacterDetailPanel
          char={selectedChar}
          isDiscovered={selectedCharDiscovered}
          onClose={() => setSelectedChar(null)}
          onPractice={() => {
            setSelectedChar(null)
            router.push('/dashboard')
          }}
        />
      )}
    </div>
  )
}
