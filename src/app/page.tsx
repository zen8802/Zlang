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
  const [age, setAge] = useState<number | null>(null)
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
    const profile = { direction, age, gender, experience }
    setUserProfile(profile)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mirai_profile', JSON.stringify(profile))
      } catch {}
    }
    // Persist to Clerk so the profile follows the user across devices/browsers.
    // Fire-and-forget — we don't want to block the redirect on a slow API call.
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
      {/* MIRAI wordmark — always visible */}
      <div className="px-8 pt-10 pb-0 shrink-0">
        <p
          className="text-[#1B4F8A]"
          style={{
            fontFamily: 'Shippori Mincho, serif',
            fontSize: '22px',
            letterSpacing: '-0.01em',
          }}
        >
          未来
        </p>
        <p
          className="text-[#9E9892] mt-0.5"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '10px',
            letterSpacing: '0.2em',
          }}
        >
          MIRAI
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
            age={age}
            gender={gender}
            onChangeAge={setAge}
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
