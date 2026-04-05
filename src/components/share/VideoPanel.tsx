'use client'

import { useRouter } from 'next/navigation'
import type { ParsedUrl } from '@/lib/url-parser'

export default function VideoPanel({ parsed }: { parsed: ParsedUrl | null }) {
  const router = useRouter()

  if (!parsed) return <div className="w-full h-full bg-black" />

  return (
    <div className="relative w-full h-full bg-black">
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-sm"
      >
        ←
      </button>
      <div className="absolute top-4 right-4 z-10">
        <span className="text-xs bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full font-body">
          {parsed.platform === 'tiktok' ? '🎵 TikTok' : parsed.platform === 'youtube-shorts' ? '📱 Shorts' : '▶️ YouTube'}
        </span>
      </div>
      <iframe src={parsed.embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media; picture-in-picture" style={{ display: 'block' }} />
    </div>
  )
}
