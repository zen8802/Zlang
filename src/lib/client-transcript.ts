'use client'

export interface CaptionSegment {
  text: string
  start: number // seconds
  duration: number // seconds
}

/**
 * Fetches YouTube captions client-side by scraping the watch page.
 * Must run in the browser — YouTube blocks server-side caption fetches.
 */
export async function fetchYouTubeCaptions(
  videoId: string,
  preferLang = 'ja',
): Promise<{ segments: CaptionSegment[]; fullText: string; language: string } | null> {
  try {
    // Fetch the watch page from the browser (has proper cookies/context)
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`)
    const html = await watchRes.text()

    // Extract ytInitialPlayerResponse JSON
    const startMarker = 'var ytInitialPlayerResponse = '
    const startIdx = html.indexOf(startMarker)
    if (startIdx === -1) return null

    const jsonStart = startIdx + startMarker.length
    let depth = 0
    let jsonEnd = jsonStart
    for (let i = jsonStart; i < html.length; i++) {
      if (html[i] === '{') depth++
      else if (html[i] === '}') {
        depth--
        if (depth === 0) {
          jsonEnd = i + 1
          break
        }
      }
    }

    const playerResponse = JSON.parse(html.slice(jsonStart, jsonEnd))
    const tracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks

    if (!tracks || tracks.length === 0) return null

    // Find preferred language track, fall back to any available
    const preferred =
      tracks.find((t: Record<string, string>) => t.languageCode === preferLang) ||
      tracks.find((t: Record<string, string>) => t.languageCode?.startsWith(preferLang)) ||
      tracks.find((t: Record<string, string>) => t.kind === 'asr') ||
      tracks[0]

    if (!preferred?.baseUrl) return null

    // Fetch the XML caption content
    const capRes = await fetch(preferred.baseUrl)
    const xml = await capRes.text()

    if (!xml || xml.length < 10) return null

    // Parse XML to extract segments
    const segments: CaptionSegment[] = []
    const regex = /<text start="([^"]*)" dur="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g
    let match

    while ((match = regex.exec(xml)) !== null) {
      const text = decodeXmlEntities(match[3].trim())
      if (text) {
        segments.push({
          text,
          start: parseFloat(match[1]),
          duration: parseFloat(match[2]),
        })
      }
    }

    const fullText = segments.map((s) => s.text).join(' ')

    return {
      segments,
      fullText,
      language: preferred.languageCode || 'unknown',
    }
  } catch {
    return null
  }
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n/g, ' ')
    .trim()
}
