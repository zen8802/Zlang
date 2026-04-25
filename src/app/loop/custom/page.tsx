'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'

const STARTER_PROMPTS = [
  "I need to tell my Japanese boss I'll be late because of train delays",
  'I want to talk to my Japanese friend about the latest anime season',
  "I'm buying a used bicycle from a Japanese stranger on Mercari",
  'I need to explain to a landlord that my shower is broken',
  "I want to compliment my Japanese coworker's cooking at a potluck",
  "I'm lost in Kyoto and need to ask a monk for directions",
  "I need to politely decline my Japanese in-laws' food offer",
  'I want to ask my Japanese neighbor to keep the noise down',
  "I'm at a job interview at a Japanese game company",
  'I want to argue (friendly) with a Japanese friend about football',
]

interface PastScenario {
  id: string
  title: string
  userDescription: string
  timesPlayed: number
  createdAt: string
}

export default function CustomScenarioPage() {
  const router = useRouter()
  const userProfile = useAppStore((s) => s.userProfile)
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [pastScenarios, setPastScenarios] = useState<PastScenario[]>([])
  const [replayingId, setReplayingId] = useState<string | null>(null)

  // Load past custom scenarios
  useEffect(() => {
    fetch('/api/scenarios/mine')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.scenarios)) {
          setPastScenarios(data.scenarios)
        }
      })
      .catch(() => {})
  }, [])

  const handleGenerate = async () => {
    if (!description.trim() || generating) return
    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/scenarios/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userDescription: description.trim(),
          userProfile,
        }),
      })

      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      if (!data?.scenario) throw new Error('No scenario returned')

      // Spin up a loop session immediately with the generated scenario
      const sessionRes = await fetch('/api/loop/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: data.scenario.id,
          customScenario: data.scenario,
          userProfile,
        }),
      })

      const sessionData = await sessionRes.json()
      if (sessionRes.status === 429) {
        setError(sessionData.message || 'You have too many active custom conversations. Complete or delete one first.')
        setGenerating(false)
        return
      }
      if (!sessionData?.sessionId) throw new Error('No session id returned')
      router.push(`/loop/session/${sessionData.sessionId}`)
    } catch (err) {
      console.error(err)
      setError('Could not generate your scenario. Please try again.')
      setGenerating(false)
    }
  }

  const handleReplay = async (scenario: PastScenario) => {
    if (replayingId) return
    setReplayingId(scenario.id)
    setError('')
    try {
      const res = await fetch('/api/loop/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          userProfile,
        }),
      })
      const data = await res.json()
      if (!data?.sessionId) throw new Error('No session id returned')
      router.push(`/loop/session/${data.sessionId}`)
    } catch {
      setError('Could not replay this scenario. Please try again.')
      setReplayingId(null)
    }
  }

  return (
    <div
      className="min-h-screen px-6 py-10 pb-24"
      style={{ backgroundColor: '#F5F0EB' }}
    >
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="text-[#9E9892] text-sm mb-8 block hover:text-[#6B6560] transition-colors"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          ← Back
        </button>

        <div className="mb-8">
          <p
            className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-2"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Custom Scenario
          </p>
          <h1
            className="text-[#1A1814] mb-3"
            style={{
              fontFamily: 'Shippori Mincho, serif',
              fontSize: '28px',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
            }}
          >
            Describe your situation
          </h1>
          <p
            className="text-[#6B6560] text-sm leading-relaxed"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Any situation. Any relationship. Any stakes. We&apos;ll build the
            perfect Japanese conversation for you.
          </p>
        </div>

        {/* Main input */}
        <div className="mb-6">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the conversation you need to have..."
            rows={4}
            disabled={generating}
            className="w-full px-4 py-4 rounded-[10px] border-2 border-[#E0DAD2] bg-[#FDFBF8] text-[#1A1814] text-sm leading-relaxed resize-none outline-none focus:border-[#1B4F8A] transition-colors placeholder-[#C8C3BC] disabled:opacity-50"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          />
          <p
            className="text-[10px] text-[#9E9892] mt-2"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Be specific — the more detail, the better the scenario
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-[8px] border"
            style={{ backgroundColor: '#F5EEEE', borderColor: '#D4BABA' }}
          >
            <p
              className="text-[#8B3A3A] text-sm"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!description.trim() || generating}
          className={`w-full py-4 rounded-[8px] text-sm font-medium transition-all duration-200 mb-8 ${
            description.trim() && !generating
              ? 'bg-[#1B4F8A] text-white hover:bg-[#4A7AB5] active:translate-y-px'
              : 'bg-[#E0DAD2] text-[#C8C3BC] cursor-not-allowed'
          }`}
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Building your scenario...
            </span>
          ) : (
            'Build this scenario →'
          )}
        </button>

        {/* Starter prompts */}
        <div>
          <p
            className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-3"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Need inspiration?
          </p>
          <div className="space-y-2">
            {STARTER_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setDescription(prompt)}
                disabled={generating}
                className="w-full text-left px-4 py-3 rounded-[8px] bg-[#FDFBF8] border border-[#E0DAD2] hover:border-[#1B4F8A]/30 hover:shadow-[0_2px_8px_rgba(26,24,20,0.06)] active:translate-y-px transition-all disabled:opacity-50"
              >
                <p
                  className="text-[#6B6560] text-sm leading-snug"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {prompt}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Past custom scenarios */}
        {pastScenarios.length > 0 && (
          <div className="mt-8">
            <p
              className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-3"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Your scenarios
            </p>
            <div className="space-y-2">
              {pastScenarios.map((scenario) => {
                const isReplaying = replayingId === scenario.id
                return (
                  <button
                    key={scenario.id}
                    onClick={() => handleReplay(scenario)}
                    disabled={!!replayingId || generating}
                    className="w-full text-left px-4 py-3 rounded-[8px] bg-[#FDFBF8] border border-[#E0DAD2] hover:border-[#1B4F8A]/30 transition-all active:translate-y-px disabled:opacity-50"
                  >
                    <p
                      className="text-[#1A1814] text-sm font-semibold"
                      style={{ fontFamily: 'Shippori Mincho, serif' }}
                    >
                      {scenario.title}
                    </p>
                    <p
                      className="text-[#9E9892] text-xs mt-0.5 truncate"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {scenario.userDescription}
                    </p>
                    <p
                      className="text-[#C8C3BC] text-[10px] mt-1"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {isReplaying
                        ? 'Loading…'
                        : `Played ${scenario.timesPlayed} time${
                            scenario.timesPlayed !== 1 ? 's' : ''
                          }`}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
