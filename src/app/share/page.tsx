'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { detectPlatform } from '@/lib/url-parser'
import LessonBuilder from '@/components/share/LessonBuilder'

function ShareContent() {
  const params = useSearchParams()
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    const sharedUrl = params.get('url') || params.get('text') || ''
    if (sharedUrl) handleUrl(sharedUrl)
  }, [params])

  const handleUrl = (inputUrl: string) => {
    const detected = detectPlatform(inputUrl)
    if (!detected) {
      setError('Paste a TikTok, Instagram, or YouTube link')
      return
    }
    setError(null)
    setUrl(inputUrl)
    setPlatform(detected)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold" style={{ color: '#1B4F8A' }}>
            学ぼう
          </h1>
          <p className="text-foreground/50 mt-1 text-sm">
            Share any Japanese video — we&apos;ll build your lesson
          </p>
        </div>

        {!url && (
          <div className="glass-card p-6">
            <p className="text-sm text-foreground/40 mb-3">
              Paste a link from TikTok, Instagram, YouTube Shorts, or YouTube
            </p>
            <input
              type="url"
              placeholder="https://..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                if (e.target.value.includes('http')) handleUrl(e.target.value)
              }}
              className="w-full px-4 py-3 rounded-xl bg-black/[0.03] border border-black/10 text-foreground placeholder-foreground/20 focus:outline-none focus:border-accent text-sm"
            />
            <div className="flex gap-2 mt-4 justify-center flex-wrap">
              {['TikTok', 'Instagram', 'YouTube', 'YouTube Shorts'].map((p) => (
                <span key={p} className="text-xs text-foreground/30 bg-black/[0.03] px-3 py-1 rounded-full">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {url && platform && <LessonBuilder url={url} platform={platform} />}
      </div>
    </div>
  )
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-foreground/30">Loading...</div>}>
      <ShareContent />
    </Suspense>
  )
}
