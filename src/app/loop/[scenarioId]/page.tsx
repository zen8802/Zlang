'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { SCENARIO_TEMPLATES, CHARACTER_ROSTER } from '@/data/scenarios'
import type { ScenarioTemplate } from '@/data/scenarios'
import { useAppStore } from '@/store/useAppStore'
import { Check, CaretDown } from '@phosphor-icons/react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DIFFICULTY_BADGE: Record<string, { color: 'green' | 'blue' | 'gold'; label: string }> = {
  beginner: { color: 'green', label: 'Beginner' },
  intermediate: { color: 'blue', label: 'Intermediate' },
  advanced: { color: 'gold', label: 'Advanced' },
}

interface CharacterChoice {
  id: string
  name: string
  nameJP: string
  description: string
  personality: string
  speechStyle: string
  relationship: string
  voiceId: string
  avatar: string
  isRecommended: boolean
}

export default function LoopScenarioPage() {
  const params = useParams()
  const router = useRouter()
  const scenarioId = params.scenarioId as string
  const userProfile = useAppStore((s) => s.userProfile)

  const [isStarting, setIsStarting] = useState(false)
  const [customSituation, setCustomSituation] = useState('')

  const scenario: ScenarioTemplate | undefined = SCENARIO_TEMPLATES.find(s => s.id === scenarioId)
  const isCustom = scenarioId === 'custom'

  // Character picker — assembles the recommended character + any alternates
  // declared on the scenario. The recommended is auto-selected; clicking the
  // character card opens the dropdown to swap.
  const recommendedId = scenario?.character.id || ''
  const characterChoices: CharacterChoice[] = (() => {
    if (!scenario) return []
    const list: CharacterChoice[] = [
      {
        id: recommendedId,
        name: scenario.character.name,
        nameJP: scenario.character.nameJP,
        description: scenario.character.description,
        personality: scenario.character.personality,
        speechStyle: scenario.character.speechStyle,
        relationship: scenario.character.relationship,
        voiceId: scenario.character.voiceId,
        avatar: scenario.character.avatar,
        isRecommended: true,
      },
    ]
    for (const alt of scenario.alternates || []) {
      const roster = CHARACTER_ROSTER.find((c) => c.id === alt.characterId)
      if (!roster || roster.id === recommendedId) continue
      list.push({
        id: roster.id,
        name: roster.name,
        nameJP: roster.nameJP,
        description: roster.description,
        personality: roster.personality,
        speechStyle: roster.speechStyle,
        relationship: alt.relationship,
        voiceId: roster.voiceId,
        avatar: roster.avatar,
        isRecommended: false,
      })
    }
    return list
  })()

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(recommendedId)
  const [characterPickerOpen, setCharacterPickerOpen] = useState(false)
  const selectedCharacter =
    characterChoices.find((c) => c.id === selectedCharacterId) || characterChoices[0]

  const handleStart = async () => {
    setIsStarting(true)
    try {
      const res = await fetch('/api/loop/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: isCustom ? 'custom' : scenarioId,
          customSituation: isCustom ? customSituation : undefined,
          userProfile,
          selectedCharacterId: !isCustom ? selectedCharacterId : undefined,
        }),
      })
      const data = await res.json()
      if (data.sessionId) {
        router.push(`/loop/session/${data.sessionId}`)
      }
    } catch (err) {
      console.error('Failed to start loop session:', err)
    } finally {
      setIsStarting(false)
    }
  }

  // ---- Custom scenario mode ----
  if (isCustom) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: '#F5F0EB' }}>
        <div className="max-w-lg mx-auto px-4 pt-8">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-bold mb-6 transition-colors hover:text-[#1B4F8A]"
            style={{ color: '#9E9892' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            Back
          </button>

          <div className="text-center mb-6">
            <span className="text-5xl block mb-3">✨</span>
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: 'Shippori Mincho', color: '#1A1814' }}
            >
              Custom Scenario
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B6560' }}>
              Describe any situation you want to practice
            </p>
          </div>

          <Card variant="elevated" padding="lg" className="mb-6">
            <label
              className="text-sm font-bold block mb-2"
              style={{ color: '#1A1814' }}
            >
              Describe the situation
            </label>
            <textarea
              value={customSituation}
              onChange={e => setCustomSituation(e.target.value)}
              placeholder="e.g. I'm at a Japanese hair salon trying to explain I want a trim but keep the length..."
              rows={4}
              className="w-full px-4 py-3 rounded-[8px] border border-[#E0DAD2] bg-[#FDFBF8] text-sm resize-none leading-relaxed focus:outline-none focus:border-[#1B4F8A] transition-colors placeholder:text-[#9E9892]"
              style={{ color: '#1A1814' }}
            />
            <p className="text-xs mt-2" style={{ color: '#9E9892' }}>
              AI will create a character and setting based on your description
            </p>
          </Card>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={isStarting || !customSituation.trim()}
            onClick={handleStart}
          >
            {isStarting ? 'Setting up...' : 'Start conversation \u2192'}
          </Button>
        </div>
      </div>
    )
  }

  // ---- Preset scenario not found ----
  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0EB' }}>
        <Card variant="elevated" padding="lg" className="max-w-sm w-full text-center mx-4">
          <p className="text-4xl mb-3">🤔</p>
          <p className="font-bold mb-2" style={{ color: '#1A1814' }}>
            Scenario not found
          </p>
          <p className="text-sm mb-4" style={{ color: '#6B6560' }}>
            This scenario doesn&apos;t exist yet.
          </p>
          <Button variant="primary" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  // ---- Preset scenario ----
  const diff = DIFFICULTY_BADGE[scenario.difficulty] || DIFFICULTY_BADGE.beginner

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F5F0EB' }}>
      <div className="max-w-lg mx-auto px-4 pt-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-bold mb-6 transition-colors hover:text-[#1B4F8A]"
          style={{ color: '#9E9892' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Back
        </button>

        {/* Hero */}
        <div className="text-center mb-6">
          <span className="text-6xl block mb-3">{scenario.emoji}</span>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: 'Shippori Mincho', color: '#1A1814' }}
          >
            {scenario.title}
          </h1>
          <p className="text-sm mt-0.5" style={{ fontFamily: 'Noto Sans JP', color: '#9E9892' }}>
            {scenario.titleJP}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge color={diff.color} size="sm">{diff.label}</Badge>
            <Badge color="gray" size="sm">{scenario.estimatedMinutes} min</Badge>
          </div>
        </div>

        {/* Description */}
        <Card variant="elevated" padding="lg" className="mb-4">
          <p className="text-sm leading-relaxed" style={{ color: '#6B6560' }}>
            {scenario.description}
          </p>
        </Card>

        {/* Character picker — preview card is clickable; opens dropdown */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => characterChoices.length > 1 && setCharacterPickerOpen((o) => !o)}
            className={`w-full rounded-[10px] border border-[#E0DAD2] bg-[#FDFBF8] px-4 py-3 text-left transition-colors focus:outline-none focus:border-[#1B4F8A] ${
              characterChoices.length > 1 ? 'hover:border-[#C8C3BC] cursor-pointer' : 'cursor-default'
            }`}
            aria-expanded={characterPickerOpen}
            disabled={characterChoices.length <= 1}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-white text-xl font-bold overflow-hidden border-2 border-white"
                style={{ backgroundColor: scenario.color || '#1B4F8A' }}
              >
                {selectedCharacter?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedCharacter.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  selectedCharacter?.name?.[0] || '?'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold flex items-center flex-wrap gap-x-1.5" style={{ color: '#1A1814' }}>
                  <span>{selectedCharacter?.name}</span>
                  <span className="font-normal text-xs" style={{ color: '#9E9892', fontFamily: 'Noto Sans JP' }}>
                    {selectedCharacter?.nameJP}
                  </span>
                  {selectedCharacter?.isRecommended && (
                    <span
                      className="italic text-[10px]"
                      style={{ color: '#1B4F8A', fontFamily: 'DM Sans, sans-serif' }}
                    >
                      recommended
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#6B6560' }}>
                  {selectedCharacter?.description}
                </p>
              </div>
              {characterChoices.length > 1 && (
                <CaretDown
                  size={16}
                  weight="bold"
                  style={{
                    color: '#9E9892',
                    transform: characterPickerOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.18s ease',
                  }}
                />
              )}
            </div>
          </button>

          {characterPickerOpen && characterChoices.length > 1 && (
            <div className="mt-2 rounded-[10px] border border-[#E0DAD2] bg-[#FDFBF8] overflow-hidden">
              <div className="px-4 py-2 border-b border-[#F5F0EB]">
                <p
                  className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  Practice with
                </p>
              </div>
              <ul className="divide-y divide-[#F5F0EB]">
                {characterChoices.map((c) => {
                  const isSelected = c.id === selectedCharacterId
                  return (
                    <li key={c.id || c.name}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCharacterId(c.id)
                          setCharacterPickerOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          isSelected ? 'bg-[#EBF0F8]' : 'hover:bg-[#F5F0EB]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold overflow-hidden border border-white"
                            style={{ backgroundColor: scenario.color || '#1B4F8A' }}
                          >
                            {c.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={c.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            ) : (
                              c.name[0]
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold flex items-center flex-wrap gap-x-1.5" style={{ color: '#1A1814' }}>
                              <span>{c.name}</span>
                              <span className="font-normal text-xs" style={{ color: '#9E9892', fontFamily: 'Noto Sans JP' }}>
                                {c.nameJP}
                              </span>
                              {c.isRecommended && (
                                <span
                                  className="italic text-[10px]"
                                  style={{ color: '#1B4F8A', fontFamily: 'DM Sans, sans-serif' }}
                                >
                                  recommended
                                </span>
                              )}
                            </p>
                            <p className="text-xs mt-0.5 leading-relaxed line-clamp-2" style={{ color: '#6B6560' }}>
                              {c.description}
                            </p>
                            <p className="text-[11px] mt-1 italic" style={{ color: '#9E9892' }}>
                              {c.relationship}
                            </p>
                          </div>
                          {isSelected && (
                            <Check size={16} weight="bold" style={{ color: '#1B4F8A', marginTop: 4 }} />
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Start button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={isStarting}
          onClick={handleStart}
        >
          {isStarting ? 'Setting up...' : 'Start conversation \u2192'}
        </Button>
      </div>
    </div>
  )
}
