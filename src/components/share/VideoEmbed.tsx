'use client'

import type { ParsedUrl } from '@/lib/url-parser'

export default function VideoEmbed({ parsed }: { parsed: ParsedUrl }) {
  const isTikTok = parsed.platform === 'tiktok'
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-black"
      style={{ paddingBottom: isTikTok ? '177%' : '56.25%' }}
    >
      <iframe
        src={parsed.embedUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
      />
    </div>
  )
}
