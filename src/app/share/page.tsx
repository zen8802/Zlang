'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { parseUrl, detectPlatform } from '@/lib/url-parser'
import UrlInput from '@/components/share/UrlInput'
import BuildingLesson from '@/components/share/BuildingLesson'
import VideoPanel from '@/components/share/VideoPanel'
import TranscriptPanel from '@/components/share/TranscriptPanel'

type Stage = 'input' | 'building' | 'ready'
type BuildStep = 'meta' | 'transcribing' | 'generating' | 'streaming'

function ShareContent() {
  const params = useSearchParams()
  const [stage, setStage] = useState<Stage>('input')
  const [buildStep, setBuildStep] = useState<BuildStep>('meta')
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
    setBuildStep('meta')

    try {
      // Step 1: Fetch metadata + try captions
      setBuildStep('transcribing')
      const metaRes = await fetch('/api/clips/fetch-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform, videoId: parsedUrl.videoId }),
      })
      const meta = await metaRes.json()

      // If no captions found, try client-side caption extraction
      let transcript = meta.transcript || ''
      let transcriptSource = meta.transcriptSource || 'none'
      let transcriptConfidence = meta.transcriptConfidence || 'low'

      if (!transcript || transcriptSource === 'none' || transcriptSource === 'metadata') {
        // Try fetching captions client-side (browser has YouTube cookies)
        try {
          const { fetchYouTubeCaptions } = await import('@/lib/client-transcript')
          const clientCaptions = await fetchYouTubeCaptions(parsedUrl.videoId, 'ja')
          if (clientCaptions && clientCaptions.segments.length > 0) {
            transcript = clientCaptions.segments.map(s => `[${Math.floor(s.start)}s] ${s.text}`).join('\n')
            transcriptSource = 'captions'
            transcriptConfidence = 'high'
          }
        } catch {
          // Client-side extraction failed too
        }
      }

      // Save to shared media history
      try {
        const history = JSON.parse(localStorage.getItem('zlang_shared_media') || '[]')
        const exists = history.some((m: Record<string, string>) => m.videoId === parsedUrl.videoId)
        if (!exists) {
          history.unshift({
            url,
            title: meta.title || 'Shared video',
            platform,
            videoId: parsedUrl.videoId,
            sharedAt: new Date().toISOString(),
          })
          localStorage.setItem('zlang_shared_media', JSON.stringify(history.slice(0, 50)))
        }
      } catch { /* ignore storage errors */ }

      // Step 2: Send to Claude for lesson generation
      setBuildStep('generating')
      const lessonRes = await fetch('/api/claude/shared-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: meta.title || '',
          transcript,
          transcriptSource,
          transcriptConfidence,
          durationSeconds: meta.durationSeconds,
          platform,
          userLevel: 'beginner',
        }),
      })

      setBuildStep('streaming')
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
  if (stage === 'building') return <BuildingLesson parsed={parsed} step={buildStep} />

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden no-bounce">
      <div className="flex-shrink-0" style={{ height: '52vh' }}>
        <VideoPanel parsed={parsed} />
      </div>
      <div
        className="flex-1 flex flex-col bg-background rounded-t-3xl overflow-hidden"
        style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.1)', marginTop: '-16px' }}
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
