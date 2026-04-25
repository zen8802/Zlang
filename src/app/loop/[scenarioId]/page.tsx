'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { SCENARIO_TEMPLATES } from '@/data/scenarios'
import type { ScenarioTemplate } from '@/data/scenarios'
import { useAppStore } from '@/store/useAppStore'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DIFFICULTY_BADGE: Record<string, { color: 'green' | 'blue' | 'gold'; label: string }> = {
  beginner: { color: 'green', label: 'Beginner' },
  intermediate: { color: 'blue', label: 'Intermediate' },
  advanced: { color: 'gold', label: 'Advanced' },
}

const HOW_IT_WORKS_BEGINNER = [
  { emoji: '💬', title: 'Experience the conversation', desc: 'Type what you want to say in English. We translate it into natural Japanese for you.' },
  { emoji: '📖', title: 'Get a personal lesson', desc: 'AI builds a lesson from exactly what happened in your conversation. Nothing generic.' },
  { emoji: '👁️', title: 'See how much you remember', desc: 'The conversation replays with translations hidden. Tap to reveal what you understood.' },
  { emoji: '🃏', title: 'Collect words you discovered', desc: 'Every Japanese word you encounter gets added to your collection automatically.' },
]

const HOW_IT_WORKS_INTERMEDIATE = [
  { emoji: '💬', title: 'Jump straight in', desc: 'No warmup. No vocab list. The character starts talking and you respond.' },
  { emoji: '😅', title: 'Struggle productively', desc: 'Freeze up, make mistakes, work around gaps. That discomfort is the learning.' },
  { emoji: '🎯', title: 'Get a surgical lesson', desc: 'AI diagnoses exactly what held you back and teaches only that. Nothing else.' },
  { emoji: '🔄', title: 'Retry with new knowledge', desc: 'Same scenario, same character. This time you have the words. Use them.' },
]

export default function LoopScenarioPage() {
  const params = useParams()
  const router = useRouter()
  const scenarioId = params.scenarioId as string
  const userProfile = useAppStore((s) => s.userProfile)

  const [isStarting, setIsStarting] = useState(false)
  const [customSituation, setCustomSituation] = useState('')

  const scenario: ScenarioTemplate | undefined = SCENARIO_TEMPLATES.find(s => s.id === scenarioId)
  const isCustom = scenarioId === 'custom'

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

        {/* Character preview */}
        <Card variant="default" padding="md" className="mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-white text-xl font-bold overflow-hidden border-2 border-white"
              style={{
                backgroundColor: scenario.color || '#1B4F8A',
              }}
            >
              {scenario.character.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={scenario.character.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                scenario.character.name[0]
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#1A1814' }}>
                {scenario.character.name}
                <span className="font-normal ml-1.5 text-xs" style={{ color: '#9E9892', fontFamily: 'Noto Sans JP' }}>
                  {scenario.character.nameJP}
                </span>
              </p>
              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#6B6560' }}>
                {scenario.character.description}
              </p>
            </div>
          </div>
        </Card>

        {/* How this works — adapts to user level */}
        {(() => {
          const isBeginnerMode = (userProfile?.experience || 1) <= 2
          const steps = isBeginnerMode ? HOW_IT_WORKS_BEGINNER : HOW_IT_WORKS_INTERMEDIATE
          return (
            <div
              className="rounded-[10px] border border-[#E0DAD2] overflow-hidden mb-6"
              style={{ backgroundColor: '#FDFBF8' }}
            >
              <div className="px-4 pt-4 pb-2">
                <p
                  className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium"
                  style={{ fontFamily: 'DM Sans' }}
                >
                  How this works
                </p>
              </div>
              <div className="divide-y divide-[#F5F0EB]">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-lg shrink-0 mt-0.5">{step.emoji}</span>
                    <div>
                      <p
                        className="text-[#1A1814] font-semibold text-sm"
                        style={{ fontFamily: 'Shippori Mincho' }}
                      >
                        {step.title}
                      </p>
                      <p
                        className="text-[#9E9892] text-xs mt-0.5 leading-relaxed"
                        style={{ fontFamily: 'DM Sans' }}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

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
