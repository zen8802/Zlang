'use client'

import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { useState, useCallback, useEffect } from 'react'
import { useUser, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Step = 1 | 2
type Level = 'beginner' | 'basics' | 'intermediate' | 'advanced'

// ---------------------------------------------------------------------------
// Level pills data
// ---------------------------------------------------------------------------
const LEVELS: { jp: string; en: string; value: Level }[] = [
  { jp: '完全初心者', en: 'Beginner', value: 'beginner' },
  { jp: '少し知ってる', en: 'Some Basics', value: 'basics' },
  { jp: '日常会話', en: 'Intermediate', value: 'intermediate' },
  { jp: 'ほぼペラペラ', en: 'Advanced', value: 'advanced' },
]

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const router = useRouter()
  const { corridor, level, uiLanguage, setCorridor, setLevel, setUiLanguage } = useAppStore()
  const { isSignedIn, isLoaded } = useUser()
  const [step, setStep] = useState<Step>(1)
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)

  // If signed in and already onboarded, go straight to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn && corridor && level) {
      router.replace('/dashboard')
    }
  }, [isLoaded, isSignedIn, corridor, level, router])

  const handleCorridorPick = useCallback(
    (c: 'en-to-jp' | 'jp-to-en') => {
      setCorridor(c)
      setStep(2)
    },
    [setCorridor],
  )

  const handleBack = useCallback(() => {
    setCorridor('en-to-jp') // reset — store expects non-null, we treat step as source of truth
    setStep(1)
    setSelectedLevel(null)
  }, [setCorridor])

  const handleLevelPick = useCallback(
    (level: Level) => {
      setSelectedLevel(level)
      setLevel(level)
      const lessonId = corridor === 'jp-to-en' ? 'jp-en-1-1' : 'en-jp-1-1'
      setTimeout(() => {
        router.push(`/lesson/${lessonId}`)
      }, 300)
    },
    [corridor, setLevel, router],
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: '#F5F0EB' }}>
      {/* Auth buttons — top right */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <SignedOut>
          <Link href="/sign-in" className="text-sm font-bold text-[#6B7280] hover:text-[#1A1A2E] transition-colors" style={{ fontFamily: 'Nunito' }}>
            Log in
          </Link>
          <Link href="/sign-up" className="text-sm font-bold text-white px-4 py-2 rounded-[12px] shadow-[0_4px_0_#133970] hover:brightness-110 active:shadow-none active:translate-y-[4px] transition-all" style={{ backgroundColor: '#1B4F8A', fontFamily: 'Nunito' }}>
            Sign up
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-9 h-9' } }} />
        </SignedIn>
      </div>

      <div className="w-full max-w-sm mx-auto">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black" style={{ fontFamily: 'Noto Sans JP', color: '#1B4F8A' }}>未来</h1>
          <p className="text-xs font-bold tracking-[0.3em] mt-1" style={{ color: '#9CA3AF', fontFamily: 'Nunito' }}>ZLANG</p>
        </div>

        {step === 1 ? (
          <div className="space-y-4 page-enter">
            {/* Learn Japanese card */}
            <div
              onClick={() => handleCorridorPick('en-to-jp')}
              className="bg-white rounded-[24px] p-6 cursor-pointer transition-all duration-150 hover:-translate-y-1 active:translate-y-[2px] active:shadow-none"
              style={{ boxShadow: '0 8px 0 rgba(27,79,138,0.15), 0 2px 16px rgba(0,0,0,0.06)', border: '2px solid #B8CBE0' }}
            >
              <div className="text-4xl mb-3">🇯🇵</div>
              <h2 className="text-2xl font-black" style={{ fontFamily: 'Nunito', color: '#1A1A2E' }}>Learn Japanese</h2>
              <p className="text-sm mt-1" style={{ color: '#6B7280', fontFamily: 'Nunito' }}>Through anime, J-drama, and real street Japanese</p>
              <div className="mt-4 w-full py-3 rounded-[16px] text-center font-bold text-white text-base shadow-[0_4px_0_#133970] hover:brightness-110 transition-all" style={{ backgroundColor: '#1B4F8A', fontFamily: 'Nunito' }}>
                Start Learning →
              </div>
            </div>

            {/* Learn English card */}
            <div
              onClick={() => handleCorridorPick('jp-to-en')}
              className="bg-white rounded-[24px] p-6 cursor-pointer transition-all duration-150 hover:-translate-y-1 active:translate-y-[2px] active:shadow-none"
              style={{ boxShadow: '0 8px 0 rgba(27,79,138,0.15), 0 2px 16px rgba(0,0,0,0.06)', border: '2px solid #B8CBE0' }}
            >
              <div className="text-4xl mb-3">🇺🇸</div>
              <h2 className="text-2xl font-black" style={{ fontFamily: 'Nunito', color: '#1A1A2E' }}>英語を学ぶ</h2>
              <p className="text-sm mt-1" style={{ color: '#6B7280', fontFamily: 'Nunito' }}>Through TikTok, NBA, and internet culture</p>
              <div className="mt-4 w-full py-3 rounded-[16px] text-center font-bold text-white text-base shadow-[0_4px_0_#133970] hover:brightness-110 transition-all" style={{ backgroundColor: '#1B4F8A', fontFamily: 'Nunito' }}>
                Start Learning →
              </div>
            </div>
          </div>
        ) : (
          <div className="page-enter">
            {/* Back link */}
            <button onClick={handleBack} className="text-sm font-bold mb-6 flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: '#6B7280', fontFamily: 'Nunito' }}>
              ← Change language
            </button>

            <h2 className="text-center text-lg font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1A2E' }}>
              What&apos;s your level?
            </h2>

            {/* 2x2 level grid */}
            <div className="grid grid-cols-2 gap-3">
              {LEVELS.map((l) => {
                const isSelected = selectedLevel === l.value
                return (
                  <div
                    key={l.value}
                    onClick={() => { setSelectedLevel(l.value); setLevel(l.value) }}
                    className={`relative bg-white rounded-[16px] p-4 text-center cursor-pointer transition-all duration-150 ${isSelected ? 'border-[#1B4F8A] bg-[#EBF0F8] shadow-[0_4px_0_#B8CBE0]' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    style={{ border: isSelected ? '2px solid #1B4F8A' : '2px solid #e5e7eb' }}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: '#1B4F8A' }}>✓</div>
                    )}
                    <p className="text-lg font-bold" style={{ fontFamily: 'Noto Sans JP', color: '#1B4F8A' }}>{l.jp}</p>
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF', fontFamily: 'Nunito' }}>{l.en}</p>
                  </div>
                )
              })}
            </div>

            {/* Go button */}
            {selectedLevel && (
              <button
                onClick={() => handleLevelPick(selectedLevel)}
                className="w-full mt-4 py-4 rounded-[20px] text-lg font-bold text-white shadow-[0_4px_0_#133970] hover:brightness-110 active:shadow-none active:translate-y-[4px] transition-all"
                style={{ backgroundColor: '#1B4F8A', fontFamily: 'Nunito' }}
              >
                Let&apos;s go! 行こう →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom language toggle */}
      <div className="fixed bottom-6 flex items-center gap-3 text-xs" style={{ color: '#9CA3AF', fontFamily: 'Nunito' }}>
        <button onClick={() => setUiLanguage('en')} className={`px-3 py-1 rounded-full font-bold transition-all ${uiLanguage === 'en' ? 'bg-[#EBF0F8] text-[#1B4F8A]' : 'hover:opacity-70'}`}>EN</button>
        <button onClick={() => setUiLanguage('jp')} className={`px-3 py-1 rounded-full font-bold transition-all ${uiLanguage === 'jp' ? 'bg-[#EBF0F8] text-[#1B4F8A]' : 'hover:opacity-70'}`} style={{ fontFamily: 'Noto Sans JP' }}>日本語</button>
      </div>
    </div>
  )
}
