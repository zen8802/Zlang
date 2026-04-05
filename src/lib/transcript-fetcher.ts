export interface TranscriptResult {
  transcript: string
  language: string
  source: 'captions' | 'description' | 'none'
  title: string
}

export async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptResult> {
  const ytKey = process.env.YOUTUBE_API_KEY
  if (!ytKey) return { transcript: '', language: 'unknown', source: 'none', title: '' }

  const detailsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${ytKey}`
  )
  const detailsData = await detailsRes.json()
  const snippet = detailsData.items?.[0]?.snippet
  const title = snippet?.title || ''
  const description = snippet?.description || ''

  return {
    transcript: `Title: ${title}\n\nDescription: ${description.slice(0, 1000)}`,
    language: detectLanguageSimple(title + ' ' + description) === 'ja' ? 'ja' : 'unknown',
    source: 'description',
    title,
  }
}

export async function fetchTikTokMetadata(videoId: string, originalUrl: string): Promise<TranscriptResult> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(originalUrl)}`)
    const data = await res.json()
    return {
      transcript: `Title: ${data.title || ''}\nAuthor: ${data.author_name || ''}`,
      language: 'unknown',
      source: 'description',
      title: data.title || '',
    }
  } catch {
    return { transcript: '', language: 'unknown', source: 'none', title: '' }
  }
}

function detectLanguageSimple(text: string): 'ja' | 'en' | 'other' {
  const jpChars = text.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g)
  const total = text.replace(/\s/g, '').length
  if (!total) return 'other'
  if ((jpChars?.length || 0) / total > 0.15) return 'ja'
  const enChars = text.match(/[a-zA-Z]/g)
  if ((enChars?.length || 0) / total > 0.5) return 'en'
  return 'other'
}
