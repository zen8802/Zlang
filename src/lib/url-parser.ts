export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'youtube-shorts'

export interface ParsedUrl {
  platform: Platform
  videoId: string
  originalUrl: string
  embedUrl: string
}

export function detectPlatform(url: string): Platform | null {
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('instagram.com/reel') || url.includes('instagram.com/p/')) return 'instagram'
  if (url.includes('youtube.com/shorts')) return 'youtube-shorts'
  if (url.includes('youtube.com/watch') || url.includes('youtu.be')) return 'youtube'
  return null
}

export function extractVideoId(url: string, platform: Platform): string | null {
  try {
    switch (platform) {
      case 'youtube':
      case 'youtube-shorts': {
        const u = new URL(url)
        if (url.includes('youtu.be')) return u.pathname.slice(1)
        if (url.includes('/shorts/')) return u.pathname.split('/shorts/')[1]?.split('/')[0] || null
        return u.searchParams.get('v')
      }
      case 'tiktok': {
        const match = url.match(/video\/(\d+)/)
        return match?.[1] || null
      }
      case 'instagram': {
        const match = url.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/)
        return match?.[2] || null
      }
    }
  } catch {
    return null
  }
}

export function buildEmbedUrl(videoId: string, platform: Platform): string {
  switch (platform) {
    case 'youtube':
    case 'youtube-shorts':
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`
    case 'tiktok':
      return `https://www.tiktok.com/embed/v2/${videoId}`
    case 'instagram':
      return `https://www.instagram.com/p/${videoId}/embed/`
  }
}

export function parseUrl(url: string): ParsedUrl | null {
  const platform = detectPlatform(url)
  if (!platform) return null
  const videoId = extractVideoId(url, platform)
  if (!videoId) return null
  return { platform, videoId, originalUrl: url, embedUrl: buildEmbedUrl(videoId, platform) }
}
