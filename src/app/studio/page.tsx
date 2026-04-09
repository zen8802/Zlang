'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Badge from '@/components/ui/Badge'
import {
  SCENARIO_TEMPLATES,
  SCENARIO_CATEGORIES,
  DIFFICULTY_LABELS,
} from '@/data/scenarios'
import type { ScenarioTemplate } from '@/data/scenarios'
import ScenarioCustomizer from '@/components/studio/ScenarioCustomizer'

export default function StudioPage() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedScenario, setSelectedScenario] = useState<ScenarioTemplate | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const filtered =
    activeCategory === 'all'
      ? SCENARIO_TEMPLATES
      : SCENARIO_TEMPLATES.filter((s) => s.category === activeCategory)

  // Group by category for display
  const grouped = filtered.reduce<Record<string, ScenarioTemplate[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  const handleStart = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (scenario: ScenarioTemplate, tweakValues: Record<string, any>) => {
      setIsStarting(true)
      try {
        const res = await fetch('/api/studio/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId: scenario.id, tweakValues }),
        })
        const data = await res.json()
        if (data.sessionId) {
          const voiceMode = tweakValues._voiceReply === 'true' ? '1' : '0'
          router.push(`/studio/${data.sessionId}?voice=${voiceMode}`)
        }
      } catch (err) {
        console.error('Failed to start session:', err)
      } finally {
        setIsStarting(false)
      }
    },
    [router],
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0EB' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-[#F5F0EB]/80 border-b border-black/5">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🎬</span>
            <div>
              <h1
                className="text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-ui)', color: '#1A1A2E' }}
              >
                Scenario Studio
              </h1>
              <p
                className="text-sm"
                style={{ fontFamily: 'var(--font-ui)', color: '#6B6560' }}
              >
                Practice real Japanese conversations
              </p>
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {SCENARIO_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold
                    whitespace-nowrap transition-all duration-150 shrink-0
                    ${
                      isActive
                        ? 'bg-[#1B4F8A] text-white '
                        : 'bg-white text-[#6B7280] border border-gray-200 hover:border-gray-300'
                    }
                  `}
                  style={{ fontFamily: 'var(--font-ui)' }}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 pb-24">
        {Object.entries(grouped).map(([category, scenarios]) => (
          <div key={category} className="page-enter">
            <h2
              className="text-lg font-bold mb-3 flex items-center gap-2"
              style={{ fontFamily: 'var(--font-ui)', color: '#1A1A2E' }}
            >
              <span>
                {SCENARIO_CATEGORIES.find((c) => c.id === category)?.emoji}
              </span>
              {category}
            </h2>

            <div className="space-y-3">
              {scenarios.map((scenario) => {
                const diff = DIFFICULTY_LABELS[scenario.difficulty]
                return (
                  <div
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className="
                      bg-white rounded-[10px] overflow-hidden
                      cursor-pointer transition-all duration-150
                      hover:-translate-y-0.5
                      active:translate-y-[2px] active:shadow-none
                    "
                    style={{
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      borderLeft: `5px solid ${scenario.color}`,
                    }}
                  >
                    <div className="p-5">
                      {/* Top row: emoji + title + difficulty */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {scenario.character.avatar ? (
                            <div className="w-11 h-11 rounded-full shrink-0 overflow-hidden border-2 border-white shadow-sm">
                              <Image src={scenario.character.avatar} alt="" width={44} height={44} className="w-full h-full object-cover" quality={90} />
                            </div>
                          ) : (
                            <span className="text-3xl shrink-0">{scenario.emoji}</span>
                          )}
                          <div className="min-w-0">
                            <h3
                              className="text-lg font-semibold leading-tight"
                              style={{ fontFamily: 'var(--font-ui)', color: '#1A1A2E' }}
                            >
                              {scenario.title}
                            </h3>
                            <p
                              className="text-sm font-bold opacity-60"
                              style={{ fontFamily: 'Noto Sans JP', color: '#1A1A2E' }}
                            >
                              {scenario.titleJP}
                            </p>
                          </div>
                        </div>
                        <Badge color={diff.color} size="sm">
                          {diff.label}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p
                        className="text-sm mt-2 leading-relaxed"
                        style={{ fontFamily: 'var(--font-ui)', color: '#6B6560' }}
                      >
                        {scenario.description}
                      </p>

                      {/* Bottom row: time + tags + character */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-xs font-bold"
                            style={{ fontFamily: 'var(--font-ui)', color: '#9CA3AF' }}
                          >
                            ~{scenario.estimatedMinutes} min
                          </span>
                          <span className="text-gray-200">|</span>
                          {scenario.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded-full bg-[#F5F0EB] font-semibold"
                              style={{ fontFamily: 'var(--font-ui)', color: '#9CA3AF' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {scenario.id !== 'custom' && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {scenario.character.avatar ? (
                              <div className="w-6 h-6 rounded-full overflow-hidden border border-white shadow-sm shrink-0">
                                <Image src={scenario.character.avatar} alt="" width={24} height={24} className="w-full h-full object-cover" quality={85} />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: scenario.color }}>
                                {scenario.character.name[0]}
                              </div>
                            )}
                            <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-ui)', color: '#6B6560' }}>
                              {scenario.character.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Scenario Customizer Modal */}
      {selectedScenario && (
        <ScenarioCustomizer
          scenario={selectedScenario}
          onClose={() => setSelectedScenario(null)}
          onStart={handleStart}
          isStarting={isStarting}
        />
      )}
    </div>
  )
}
