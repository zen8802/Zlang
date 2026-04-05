'use client'

import { useState, useEffect } from 'react'
import { parseUrl } from '@/lib/url-parser'
import VideoEmbed from './VideoEmbed'
import TranscriptLesson from './TranscriptLesson'
import LessonSkeleton from './LessonSkeleton'

interface Props {
  url: string
  platform: string
}

export default function LessonBuilder({ url, platform }: Props) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [lesson, setLesson] = useState<Record<string, unknown> | null>(null)
  const [parsed, setParsed] = useState<ReturnType<typeof parseUrl>>(null)
  const [loadingMessage, setLoadingMessage] = useState('Reading your video...')

  const messages = [
    'Reading your video...',
    'Analyzing Japanese content...',
    'Building your lesson...',
    'Almost ready...',
  ]

  useEffect(() => {
    buildLesson()
  }, [url])

  useEffect(() => {
    if (phase !== 'loading') return
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % messages.length
      setLoadingMessage(messages[i])
    }, 2000)
    return () => clearInterval(interval)
  }, [phase])

  const buildLesson = async () => {
    try {
      setPhase('loading')
      const parsedUrl = parseUrl(url)
      if (!parsedUrl) throw new Error('Could not parse URL')
      setParsed(parsedUrl)

      const metaRes = await fetch('/api/clips/fetch-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform, videoId: parsedUrl.videoId }),
      })
      const meta = await metaRes.json()

      const lessonRes = await fetch('/api/claude/shared-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: meta.title || 'Shared video',
          transcript: meta.transcript || '',
          platform,
          videoId: parsedUrl.videoId,
          userLevel: 'beginner',
        }),
      })

      const reader = lessonRes.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let raw = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value)
      }

      const cleaned = raw.replace(/```json|```/g, '').trim()
      const parsedLesson = JSON.parse(cleaned)
      setLesson(parsedLesson)
      setPhase('ready')
    } catch (err) {
      console.error('Lesson build error:', err)
      setPhase('error')
    }
  }

  if (phase === 'loading') return <LessonSkeleton message={loadingMessage} />

  if (phase === 'error') {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Could not build lesson from this video.</p>
        <p className="text-foreground/40 text-sm mt-2">
          Try a video with Japanese dialogue and captions.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {parsed && <VideoEmbed parsed={parsed} />}

      {lesson && (
        <>
          <div className="glass-card p-5">
            <p className="text-foreground/60 text-sm">{lesson.videoSummary as string}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                {lesson.overallJlptLevel as string}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-black/[0.03] text-foreground/50">
                {(lesson.keyGrammarPoints as string[])?.length || 0} grammar points
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-black/[0.03] text-foreground/50">
                {(lesson.lessonVocab as unknown[])?.length || 0} vocab words
              </span>
            </div>
          </div>

          <TranscriptLesson lesson={lesson} />
        </>
      )}
    </div>
  )
}
