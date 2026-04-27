'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'
import { useAppStore } from '@/store/useAppStore'
import Navbar from '@/components/layout/Navbar'
import { SCENARIO_TEMPLATES } from '@/data/scenarios'
import ResumeCard from '@/components/loop/ResumeCard'
import ConversationsCard from '@/components/loop/ConversationsCard'

interface ActiveSession {
  id: string
  scenario_id: string
  current_phase: string
}

export default function DashboardPage() {
  const router = useRouter()
  const corridor = useAppStore((s) => s.corridor)
  // Map of scenarioId → active session (for showing "Continue" on scenario cards)
  const [activeByScenario, setActiveByScenario] = useState<Record<string, ActiveSession>>({})

  useEffect(() => {
    fetch('/api/loop/sessions/recent')
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, ActiveSession> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const s of (data.sessions || []) as any[]) {
          if (s.status !== 'complete' && !s.is_abandoned && s.scenario_id && !map[s.scenario_id]) {
            map[s.scenario_id] = { id: s.id, scenario_id: s.scenario_id, current_phase: s.current_phase }
          }
        }
        setActiveByScenario(map)
      })
      .catch(() => {})
  }, [])
  const loginStreak = useAppStore((s) => s.loginStreak)
  const registerLogin = useAppStore((s) => s.registerLogin)

  // Stamp today's login the first time the dashboard mounts.
  useEffect(() => {
    registerLogin()
  }, [registerLogin])

  useEffect(() => {
    if (!corridor) router.replace('/')
  }, [corridor, router])

  if (!corridor) return null

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F5F0EB' }}>
      <Navbar />

      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* ── Resume active session card ───────────────────────────────── */}
        <ResumeCard />

        {/* ── Daily login streak — replaces the deleted XP system ───────── */}
        <div
          className="bg-[#FDFBF8] rounded-[10px] border border-[#E0DAD2] p-5 mb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-1"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Daily login
              </p>
              <p
                className="text-[#1A1814]"
                style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '16px' }}
              >
                {loginStreak === 0
                  ? 'Welcome — your streak starts today'
                  : loginStreak === 1
                    ? 'First day — keep it going tomorrow'
                    : `${loginStreak} days in a row`}
              </p>
            </div>
            <div className="text-right">
              <p
                className="text-[#1B4F8A]"
                style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '36px', lineHeight: 1 }}
              >
                {loginStreak}
                <span style={{ fontSize: '18px', color: '#9E9892' }}> 日</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Word Dictionary card — opens the collection ──────────────── */}
        <Link href="/collection" className="block mb-4">
          <div
            className="bg-[#FDFBF8] rounded-[10px] border border-[#E0DAD2] p-5 hover:border-[#1B4F8A]/30 hover:shadow-[0_2px_12px_rgba(26,24,20,0.08)] active:translate-y-px transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[10px] overflow-hidden shrink-0">
                <Image
                  src="/CollectionLogoMain.png"
                  alt="Word Collection"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-0.5"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  Word Dictionary
                </p>
                <p
                  className="text-[#1A1814]"
                  style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '16px' }}
                >
                  Your collection
                </p>
                <p
                  className="text-[#9E9892] text-xs mt-0.5"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  Words you&apos;ve met in real conversation
                </p>
              </div>
              <span className="text-[#C8C3BC]">→</span>
            </div>
          </div>
        </Link>

        {/* Recently-collected card preview (only shows when the user has cards) */}

        {/* ── Recent conversations ──────────────────────────────────────── */}
        <ConversationsCard />

        {/* ── Custom scenario entry — describe any conversation ─────────── */}
        <div className="bg-[#FDFBF8] rounded-[10px] border border-[#E0DAD2] p-4 mb-4">
          <p
            className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-1"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Your situation
          </p>
          <p
            className="text-[#1A1814] mb-3"
            style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '16px' }}
          >
            Practice any conversation you actually need
          </p>
          <button
            onClick={() => router.push('/loop/custom')}
            className="w-full py-3 rounded-[8px] border-2 border-dashed border-[#1B4F8A]/30 text-[#1B4F8A] text-sm font-medium hover:bg-[#EBF0F8] transition-colors"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Describe your scenario →
          </button>
        </div>

        {/* ── Loop hero — Jump In ───────────────────────────────────────── */}
        <div className="mb-4">
          <h2
            className="mb-1"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9E9892',
            }}
          >
            Jump in
          </h2>
          <p
            className="text-xs mb-3"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#6B6560' }}
          >
            Try, learn, retry — the fastest way to real Japanese
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {SCENARIO_TEMPLATES.filter((s) => s.id !== 'custom').slice(0, 6).map((scenario) => {
              const active = activeByScenario[scenario.id]
              const href = active
                ? `/loop/session/${active.id}`
                : `/loop/${scenario.id}`
              return (
                <Link key={scenario.id} href={href}>
                  <div
                    className="w-[130px] shrink-0 bg-[#FDFBF8] rounded-[10px] p-4 text-center cursor-pointer transition-all duration-150 hover:border-[#1B4F8A] active:translate-y-px"
                    style={{
                      boxShadow: '0 1px 4px rgba(26,24,20,0.06)',
                      border: active ? '1.5px solid #1B4F8A' : '1px solid #E0DAD2',
                    }}
                  >
                    <span className="text-3xl block mb-2">{scenario.emoji}</span>
                    <span
                      className="text-xs font-bold block leading-tight"
                      style={{ color: '#1A1814' }}
                    >
                      {scenario.title}
                    </span>
                    {active ? (
                      <span
                        className="text-[10px] block mt-1 font-medium"
                        style={{ color: '#1B4F8A' }}
                      >
                        Continue →
                      </span>
                    ) : (
                      <span
                        className="text-[10px] block mt-1"
                        style={{ color: '#9E9892' }}
                      >
                        {scenario.estimatedMinutes} min
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
        {/* ── Admin tools ──────────────────────────────────────────── */}
        <AdminResetButton />
      </main>
    </div>
  )
}

function AdminResetButton() {
  const { user } = useUser()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_CLERK_ID
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [done, setDone] = useState(false)

  if (!user || !adminId || user.id !== adminId) return null

  const handleReset = async () => {
    setResetting(true)
    try {
      await fetch('/api/admin/reset-collection', { method: 'POST' })
      // Clear the Zustand persisted store so the UI reflects the reset
      useAppStore.setState({
        discoveredKanji: [],
        seenKanji: [],
      })
      setDone(true)
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      setResetting(false)
    }
  }

  return (
    <div
      className="rounded-[10px] p-5 mb-4"
      style={{
        backgroundColor: 'rgba(180, 60, 60, 0.06)',
        border: '1px solid rgba(180, 60, 60, 0.15)',
      }}
    >
      <p
        className="text-[10px] tracking-widest uppercase font-medium mb-1"
        style={{ fontFamily: 'DM Sans, sans-serif', color: '#B43C3C' }}
      >
        Admin Tools
      </p>
      <p
        className="text-[#1A1814] mb-3"
        style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '14px' }}
      >
        Reset your character collection for testing
      </p>

      {done ? (
        <p
          className="text-sm font-medium"
          style={{ fontFamily: 'DM Sans, sans-serif', color: '#3D6B4F' }}
        >
          Done — reloading...
        </p>
      ) : confirming ? (
        <div>
          <p
            className="text-sm mb-2"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#6B6560' }}
          >
            This wipes all seen and learned characters. Are you sure?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-4 py-2 rounded-[8px] text-sm font-medium text-white cursor-pointer transition-colors"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                backgroundColor: resetting ? '#9E9892' : '#B43C3C',
              }}
            >
              {resetting ? 'Resetting...' : 'Yes, reset everything'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={resetting}
              className="px-4 py-2 rounded-[8px] text-sm font-medium cursor-pointer transition-colors"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                color: '#6B6560',
                backgroundColor: 'rgba(0,0,0,0.04)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="px-4 py-2 rounded-[8px] text-sm font-medium cursor-pointer transition-colors"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            color: '#B43C3C',
            backgroundColor: 'rgba(180, 60, 60, 0.08)',
            border: '1px solid rgba(180, 60, 60, 0.2)',
          }}
        >
          Reset my collection
        </button>
      )}
    </div>
  )
}
