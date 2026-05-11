'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store/useAppStore'
import { GRADE_1_KANJI } from '@/data/kyouiku-kanji'
import KanjiGridView from '@/components/collection/KanjiGridView'
import PhrasebookView from '@/components/collection/PhrasebookView'

type TabKey = 'kanji' | 'phrasebook'

export default function CollectionPage() {
  const discoveredKanjiArray = useAppStore((s) => s.discoveredKanji)
  const storeSeenKanji = useAppStore((s) => s.seenKanji)
  const userProfile = useAppStore((s) => s.userProfile)

  const [activeTab, setActiveTab] = useState<TabKey>('kanji')

  const discoveredKanjiSet = useMemo(() => new Set(discoveredKanjiArray), [discoveredKanjiArray])
  const seenKanjiSet = useMemo(() => new Set(storeSeenKanji), [storeSeenKanji])

  const grade1Set = useMemo(() => new Set(GRADE_1_KANJI.map((k) => k.character)), [])
  const kanjiDiscoveredCount = discoveredKanjiArray.filter((k) => grade1Set.has(k)).length

  const tabs: { key: TabKey; label: string; count: string }[] = [
    { key: 'kanji', label: 'Kanji', count: `${kanjiDiscoveredCount}/80` },
    { key: 'phrasebook', label: 'Phrasebook', count: '' },
  ]


  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F5F0EB' }}>
      {/* Sticky header */}
      <header
        className="sticky top-0 z-20 px-6 pt-10 pb-0"
        style={{ backgroundColor: '#F5F0EB' }}
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 mb-3 text-[#9E9892] hover:text-[#6B6560] transition-colors"
          style={{ fontFamily: 'DM Sans', fontSize: '12px' }}
        >
          ← Dashboard
        </Link>
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
        {/* Tabs — Kanji is the primary tab (2/3 width), Phrasebook is the
            secondary tab (1/3 width). The sliding underline tracks the
            active tab's bounds. */}
        <div className="relative mt-4">
          <div className="flex">
            {tabs.map((tab) => {
              const isPrimary = tab.key === 'kanji'
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="pb-3 pt-1 text-center cursor-pointer transition-colors"
                  style={{ flex: isPrimary ? 2 : 1 }}
                >
                  <span
                    style={{
                      fontFamily: 'DM Sans',
                      fontSize: isPrimary ? '14px' : '12px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#1B4F8A' : '#9E9892',
                    }}
                  >
                    {tab.label}
                  </span>
                  {tab.count && (
                    <span
                      className="ml-1"
                      style={{
                        fontFamily: 'DM Mono',
                        fontSize: isPrimary ? '10px' : '9px',
                        color: isActive ? '#1B4F8A' : '#C8C3BC',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Sliding underline — anchored to the 2:1 column ratio */}
          <div
            className="absolute bottom-0 h-[2px] rounded-full transition-all duration-300"
            style={{
              backgroundColor: '#1B4F8A',
              width: activeTab === 'kanji' ? '66.6667%' : '33.3333%',
              left: activeTab === 'kanji' ? '0%' : '66.6667%',
            }}
          />
        </div>
      </header>

      {/* Tab content */}
      <main className="max-w-lg mx-auto px-4 pt-4">
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
