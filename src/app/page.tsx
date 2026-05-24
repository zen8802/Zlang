'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { LanguageStep } from '@/components/onboarding/LanguageStep'
import { ProfileStep } from '@/components/onboarding/ProfileStep'
import { ExperienceStep } from '@/components/onboarding/ExperienceStep'
import { useAppStore } from '@/store/useAppStore'

type Step = 'language' | 'profile' | 'experience'

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const setUserProfile = useAppStore((s) => s.setUserProfile)

  const [step, setStep] = useState<Step>('language')
  const [direction, setDirection] = useState<'en-to-jp' | 'jp-to-en'>('en-to-jp')
  const [birthYear, setBirthYear] = useState<number | null>(null)
  const [gender, setGender] = useState<string | null>(null)
  const [experience, setExperience] = useState<number>(1)
  const [exiting, setExiting] = useState(false)

  const advance = (nextStep: Step) => {
    setExiting(true)
    setTimeout(() => {
      setStep(nextStep)
      setExiting(false)
    }, 220)
  }

  const finish = async () => {
    const profile = { direction, birthYear, gender, experience }
    setUserProfile(profile)

    // Persist to the database (canonical source for AI prompts).
    // Fire-and-forget — Zustand + Clerk cover the immediate session.
    void fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gender,
        birthYear,
        experienceLevel: experience,
        nativeLanguage: direction === 'jp-to-en' ? 'ja' : 'en',
        targetLanguage: direction === 'jp-to-en' ? 'en' : 'ja',
      }),
    }).catch(() => { /* DB is best-effort; local + Clerk already cover us */ })

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mirai_profile', JSON.stringify(profile))
      } catch {}
    }
    // Persist to Clerk so the profile follows the user across devices/browsers.
    if (user) {
      void user
        .update({
          unsafeMetadata: {
            ...(user.unsafeMetadata || {}),
            miraiProfile: profile,
          },
        })
        .catch(() => {
          /* ignore — local store + localStorage already cover this session */
        })
    }
    router.push('/dashboard')
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F5F0EB' }}
    >
      {/* Kombu wordmark — always visible */}
      <div className="px-8 pt-10 pb-0 shrink-0">
        <p
          style={{
            fontFamily: 'Geist, sans-serif',
            fontSize: '24px',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#bbead6',
          }}
        >
          KOMBU
        </p>
      </div>

      {/* Step content */}
      <div
        className="flex-1 flex flex-col px-8 pt-10"
        style={{
          opacity: exiting ? 0 : 1,
          transform: exiting ? 'translateX(-16px)' : 'translateX(0)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}
      >
        {step === 'language' && (
          <LanguageStep
            value={direction}
            onChange={setDirection}
            onContinue={() => advance('profile')}
          />
        )}
        {step === 'profile' && (
          <ProfileStep
            birthYear={birthYear}
            gender={gender}
            onChangeBirthYear={setBirthYear}
            onChangeGender={setGender}
            onContinue={() => advance('experience')}
            onBack={() => advance('language')}
          />
        )}
        {step === 'experience' && (
          <ExperienceStep
            value={experience}
            onChange={setExperience}
            onContinue={finish}
            onBack={() => advance('profile')}
          />
        )}
      </div>
    </div>
  )
}
