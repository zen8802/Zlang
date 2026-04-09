'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { DIFFICULTY_LABELS } from '@/data/scenarios'
import type { ScenarioTemplate, ScenarioTweak } from '@/data/scenarios'

interface ScenarioCustomizerProps {
  scenario: ScenarioTemplate
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onStart: (scenario: ScenarioTemplate, tweakValues: Record<string, any>) => void
  isStarting: boolean
}

export function ScenarioCustomizer({
  scenario,
  onClose,
  onStart,
  isStarting,
}: ScenarioCustomizerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tweakValues, setTweakValues] = useState<Record<string, any>>(() => {
    const defaults: Record<string, string | boolean> = {}
    scenario.tweaks.forEach((t) => {
      defaults[t.id] = t.defaultValue
    })
    return defaults
  })

  const updateTweak = useCallback((id: string, value: string | boolean) => {
    setTweakValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  const diff = DIFFICULTY_LABELS[scenario.difficulty]
  const isCustom = scenario.id === 'custom'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="
          relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto
          bg-[#F5F0EB] rounded-t-[28px] sm:rounded-[28px]
          shadow-[0_-8px_40px_rgba(0,0,0,0.15)]
          page-enter
        "
      >
        {/* Header with gradient */}
        <div
          className="relative p-6 pb-4 rounded-t-[28px] sm:rounded-t-[28px] overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${scenario.color}15, ${scenario.color}08)`,
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-gray-500 hover:bg-black/20 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <span className="text-5xl">{scenario.emoji}</span>
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: 'var(--font-ui)', color: '#1A1A2E' }}
              >
                {scenario.title}
              </h2>
              <p
                className="text-base font-bold opacity-60"
                style={{ fontFamily: 'Noto Sans JP', color: '#1A1A2E' }}
              >
                {scenario.titleJP}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge color={diff.color} size="sm">
                  {diff.label}
                </Badge>
                <span
                  className="text-xs font-bold"
                  style={{ fontFamily: 'var(--font-ui)', color: '#9CA3AF' }}
                >
                  ~{scenario.estimatedMinutes} min
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 space-y-5">
          {/* Setting */}
          {!isCustom && (
            <Card variant="flat" padding="md">
              <div className="flex items-start gap-2">
                <span className="text-lg">📍</span>
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ fontFamily: 'var(--font-ui)', color: '#9CA3AF' }}
                  >
                    Setting
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: 'var(--font-ui)', color: '#4B5563' }}
                  >
                    {scenario.setting}
                  </p>
                  <p
                    className="text-sm mt-1 opacity-60"
                    style={{ fontFamily: 'Noto Sans JP', color: '#4B5563' }}
                  >
                    {scenario.settingJP}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Character */}
          {!isCustom && (
            <Card variant="flat" padding="md">
              <div className="flex items-start gap-3">
                {scenario.character.avatar ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md">
                    <Image src={scenario.character.avatar} alt={scenario.character.name} width={56} height={56} className="w-full h-full object-cover" quality={90} />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-lg" style={{ backgroundColor: scenario.color, fontFamily: 'var(--font-ui)' }}>
                    {scenario.character.name[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className="text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ fontFamily: 'var(--font-ui)', color: '#9CA3AF' }}
                  >
                    Character
                  </p>
                  <p
                    className="font-bold text-sm"
                    style={{ fontFamily: 'var(--font-ui)', color: '#1A1A2E' }}
                  >
                    {scenario.character.name}{' '}
                    <span
                      className="font-normal opacity-60"
                      style={{ fontFamily: 'Noto Sans JP' }}
                    >
                      ({scenario.character.nameJP})
                    </span>
                  </p>
                  <p
                    className="text-sm mt-1 leading-relaxed"
                    style={{ fontFamily: 'var(--font-ui)', color: '#6B6560' }}
                  >
                    {scenario.character.description}
                  </p>
                  <p
                    className="text-xs mt-1.5"
                    style={{ fontFamily: 'var(--font-ui)', color: '#9CA3AF' }}
                  >
                    Speech: {scenario.character.speechStyle}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Goal */}
          {!isCustom && (
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-ui)', color: '#9CA3AF' }}
              >
                <span>🎯</span> Your Goal
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: 'var(--font-ui)', color: '#4B5563' }}
              >
                {scenario.userGoal}
              </p>
            </div>
          )}

          {/* Cultural Notes */}
          {scenario.culturalNotes.length > 0 && (
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-ui)', color: '#9CA3AF' }}
              >
                <span>🏮</span> Cultural Tips
              </p>
              <div className="space-y-1.5">
                {scenario.culturalNotes.map((note, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    style={{ fontFamily: 'var(--font-ui)', color: '#6B6560' }}
                  >
                    <span className="text-[#7A5C2E] mt-0.5 shrink-0">&#9679;</span>
                    <span className="leading-relaxed">{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tweaks */}
          {scenario.tweaks.length > 0 && (
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-ui)', color: '#9CA3AF' }}
              >
                <span>🎛️</span> Customize
              </p>
              <div className="space-y-4">
                {scenario.tweaks.map((tweak) => (
                  <TweakControl
                    key={tweak.id}
                    tweak={tweak}
                    value={tweakValues[tweak.id]}
                    onChange={(val) => updateTweak(tweak.id, val)}
                    accentColor={scenario.color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Mode toggles */}
          <div className="bg-white rounded-[10px] p-4 mb-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-ui)' }}>Mode</p>

            {/* Voice Reply */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-ui)', color: '#1A1A2E' }}>🎤 Voice Reply</p>
                <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Speak your answer instead of tapping</p>
              </div>
              <button
                onClick={() => updateTweak('_voiceReply', tweakValues._voiceReply === 'true' ? 'false' : 'true')}
                className={`w-11 h-6 rounded-full transition-all duration-200 relative ${tweakValues._voiceReply === 'true' ? 'bg-[#1B4F8A]' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${tweakValues._voiceReply === 'true' ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Start button */}
          <div className="pt-2 pb-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => onStart(scenario, tweakValues)}
              disabled={isStarting}
            >
              {isStarting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting...
                </span>
              ) : (
                <>Start Conversation &rarr;</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tweak Control Component
// ---------------------------------------------------------------------------

interface TweakControlProps {
  tweak: ScenarioTweak
  value: string | boolean
  onChange: (value: string | boolean) => void
  accentColor: string
}

function TweakControl({ tweak, value, onChange, accentColor }: TweakControlProps) {
  if (tweak.type === 'toggle') {
    const isOn = value === true
    return (
      <div className="flex items-center justify-between">
        <p
          className="text-sm font-bold"
          style={{ fontFamily: 'var(--font-ui)', color: '#4B5563' }}
        >
          {tweak.label}
        </p>
        <button
          onClick={() => onChange(!isOn)}
          className={`
            relative w-12 h-7 rounded-full transition-all duration-200
            ${isOn ? '' : 'bg-gray-200'}
          `}
          style={isOn ? { backgroundColor: accentColor } : undefined}
        >
          <div
            className={`
              absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200
              ${isOn ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    )
  }

  if (tweak.type === 'text') {
    return (
      <div>
        <p
          className="text-sm font-bold mb-2"
          style={{ fontFamily: 'var(--font-ui)', color: '#4B5563' }}
        >
          {tweak.label}
        </p>
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Describe ${tweak.label.toLowerCase()}...`}
          className="
            w-full p-3 rounded-[8px] border-2 border-gray-200
            bg-white text-sm resize-none
            focus:outline-none focus:border-[#1B4F8A]
            transition-colors placeholder:text-gray-300
          "
          style={{ fontFamily: 'var(--font-ui)', color: '#1A1A2E', minHeight: '80px' }}
        />
      </div>
    )
  }

  // Select — rendered as option cards
  if (tweak.type === 'select' && tweak.options) {
    return (
      <div>
        <p
          className="text-sm font-bold mb-2"
          style={{ fontFamily: 'var(--font-ui)', color: '#4B5563' }}
        >
          {tweak.label}
        </p>
        <div className="grid grid-cols-1 gap-2">
          {tweak.options.map((option) => {
            const isSelected = value === option
            return (
              <div
                key={option}
                onClick={() => onChange(option)}
                className={`
                  relative bg-white rounded-[8px] px-4 py-3 cursor-pointer
                  transition-all duration-150 text-sm font-semibold
                  ${
                    isSelected
                      ? ''
                      : 'hover:bg-gray-50'
                  }
                `}
                style={{
                  border: isSelected
                    ? '2px solid #1B4F8A'
                    : '2px solid #e5e7eb',
                  fontFamily: 'var(--font-ui)',
                  color: isSelected ? '#1B4F8A' : '#6B7280',
                  backgroundColor: isSelected ? '#EBF0F8' : undefined,
                }}
              >
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: '#1B4F8A' }}
                  >
                    &#10003;
                  </div>
                )}
                {option}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}

export default ScenarioCustomizer
