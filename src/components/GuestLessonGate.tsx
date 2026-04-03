'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getLessonById } from '@/data/curriculum'

export default function GuestLessonGate({ lessonId }: { lessonId: string }) {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    // Check if this is a first lesson (lessonNumber === 1)
    const lesson = getLessonById(lessonId)
    const isFirstLesson = lesson?.lessonNumber === 1

    // First lesson is always free
    if (isFirstLesson) return

    // If not signed in and trying to access lesson beyond first
    if (!isSignedIn) {
      localStorage.setItem('zlang_intended_lesson', lessonId)
      router.push('/sign-up?reason=continue')
    }
  }, [isSignedIn, isLoaded, lessonId, router])

  return null
}
