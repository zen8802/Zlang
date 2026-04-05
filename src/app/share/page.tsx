'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { parseUrl, detectPlatform } from '@/lib/url-parser'
import UrlInput from '@/components/share/UrlInput'
import BuildingLesson from '@/components/share/BuildingLesson'
import VideoPanel from '@/components/share/VideoPanel'
import TranscriptPanel from '@/components/share/TranscriptPanel'

type Stage = 'input' | 'building' | 'ready'

function ShareContent() {
  const params = useSearchParams()
  const [stage, setStage] = useState<Stage>('input')
  const [parsed, setParsed] = useState<ReturnType<typeof parseUrl>>(null)
  const [lesson, setLesson] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sharedUrl = params.get('url') || params.get('text') || ''
    if (sharedUrl?.includes('http')) handleUrl(sharedUrl)
  }, [params])

  const handleUrl = async (url: string) => {
    const platform = detectPlatform(url)
    if (!platform) {
      setError('Paste a TikTok or YouTube link')
      return
    }
    const parsedUrl = parseUrl(url)
    if (!parsedUrl) {
      setError('Could not read this link')
      return
    }
    setError(null)
    setParsed(parsedUrl)
    setStage('building')

    try {
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
          videoTitle: meta.title || '',
          transcript: meta.transcript || '',
          platform,
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
      setLesson(JSON.parse(cleaned))
      setStage('ready')
    } catch {
      setError('Could not build lesson. Try a video with Japanese dialogue.')
      setStage('input')
    }
  }

  if (stage === 'input') return <UrlInput onSubmit={handleUrl} error={error} />
  if (stage === 'building') return <BuildingLesson parsed={parsed} />

  return (
    <div className="fixed inset-0 flex flex-col bg-black overflow-hidden no-bounce">
      <div className="flex-shrink-0" style={{ height: '52vh' }}>
        <VideoPanel parsed={parsed} />
      </div>
      <div
        className="flex-1 flex flex-col bg-white rounded-t-3xl overflow-hidden"
        style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.3)', marginTop: '-16px' }}
      >
        {lesson && <TranscriptPanel lesson={lesson} />}
      </div>
    </div>
  )
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center text-foreground/30">Loading...</div>}>
      <ShareContent />
    </Suspense>
  )
}
