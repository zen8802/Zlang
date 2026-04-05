'use client'

import { useEffect, useState } from 'react'
import type { ParsedUrl } from '@/lib/url-parser'

const MESSAGES = [
  '読んでいます... Reading your video',
  '分析中... Analyzing Japanese',
  '翻訳中... Translating sentences',
  'もうすぐ... Almost ready',
]

export default function BuildingLesson({ parsed }: { parsed: ParsedUrl | null }) {
  const [msgIdx, setMsgIdx] = useState(0)
  const [dots, setDots] = useState(0)

  useEffect(() => {
    const msgTimer = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 2500)
    const dotTimer = setInterval(() => setDots((d) => (d + 1) % 4), 400)
    return () => { clearInterval(msgTimer); clearInterval(dotTimer) }
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <div style={{ height: '52vh' }}>
        {parsed && (
          <iframe src={parsed.embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
        )}
      </div>

      <div className="flex-1 bg-white rounded-t-3xl flex flex-col items-center justify-center px-6" style={{ marginTop: '-16px' }}>
        <div className="relative mb-6">
          <div className="text-6xl animate-pulse font-jp">学</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-[#1B4F8A]/20 animate-ping" />
          </div>
        </div>
        <p className="text-sm text-foreground/40 font-body text-center transition-all duration-500">
          {MESSAGES[msgIdx]}{'.'.repeat(dots)}
        </p>
        <div className="w-48 h-1 bg-gray-100 rounded-full mt-4 overflow-hidden">
          <div className="h-full rounded-full" style={{ backgroundColor: '#1B4F8A', animation: 'buildProgress 8s ease-in-out infinite' }} />
        </div>
      </div>
    </div>
  )
}
