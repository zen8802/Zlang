'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { GRADE_1_KANJI } from '@/data/kyouiku-kanji'
import KanjiGridView from '@/components/collection/KanjiGridView'
import PhrasebookView from '@/components/collection/PhrasebookView'
import LearnedWordsView from '@/components/collection/LearnedWordsView'

type TabKey = 'learned' | 'phrasebook' | 'kanji'

export default function CollectionPage() {
  const discoveredKanjiArray = useAppStore((s) => s.discoveredKanji)
  const storeSeenKanji = useAppStore((s) => s.seenKanji)
  const userProfile = useAppStore((s) => s.userProfile)

  const [activeTab, setActiveTab] = useState<TabKey>('learned')

  const discoveredKanjiSet = useMemo(() => new Set(discoveredKanjiArray), [discoveredKanjiArray])
  const seenKanjiSet = useMemo(() => new Set(storeSeenKanji), [storeSeenKanji])

  const grade1Set = useMemo(() => new Set(GRADE_1_KANJI.map((k) => k.character)), [])
  const kanjiDiscoveredCount = discoveredKanjiArray.filter((k) => grade1Set.has(k)).length

  const tabs: { key: TabKey; label: string; count: string }[] = [
    { key: 'learned', label: 'Learned', count: '' },
    { key: 'phrasebook', label: 'Saved', count: '' },
    { key: 'kanji', label: 'Kanji', count: `${kanjiDiscoveredCount}/80` },
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

        {/* Tab bar */}
        <div className="relative mt-4">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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
                {tab.count && (
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
                )}
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

      {/* Tab content */}
      <main className="max-w-lg mx-auto px-4 pt-4">
        {activeTab === 'learned' && <LearnedWordsView />}

        {activeTab === 'phrasebook' && <PhrasebookView />}

        {activeTab === 'kanji' && (
          <KanjiGridView
            grade1Kanji={GRADE_1_KANJI}
            discoveredKanji={discoveredKanjiSet}
            seenKanji={seenKanjiSet}
            userExperience={userProfile?.experience || 1}
          />
        )}
      </main>
    </div>
  )
}
