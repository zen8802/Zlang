import { fetchYouTubeTranscript, fetchTikTokMetadata } from '@/lib/transcript-fetcher'

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3'

async function getVideoMetadata(videoId: string) {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return null

  try {
    const res = await fetch(
      `${YOUTUBE_API}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${key}`,
    )
    const data = await res.json()
    const item = data.items?.[0]
    if (!item) return null

    return {
      title: item.snippet.title,
      description: (item.snippet.description || '').slice(0, 500),
      channelTitle: item.snippet.channelTitle,
      duration: item.contentDetails.duration,
      viewCount: item.statistics.viewCount,
      thumbnail:
        item.snippet.thumbnails?.maxres?.url ||
        item.snippet.thumbnails?.high?.url ||
        '',
    }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { url, platform, videoId } = await req.json()

    const result: Record<string, unknown> = {
      title: '',
      transcript: '',
      transcriptSource: 'none',
      transcriptConfidence: 'low',
      segments: [],
      metadata: null,
    }

    if (platform === 'youtube' || platform === 'youtube-shorts') {
      // Get video metadata from YouTube API
      const metadata = await getVideoMetadata(videoId)
      if (metadata) {
        result.title = metadata.title
        result.metadata = metadata
      }

      // Get transcript via three-layer pipeline
      const transcriptResult = await fetchYouTubeTranscript(videoId)

      if (transcriptResult.transcript) {
        result.transcript = transcriptResult.transcript
        result.transcriptSource = transcriptResult.source
        result.transcriptConfidence = transcriptResult.confidence
        result.segments = transcriptResult.segments
        result.language = transcriptResult.language
        result.durationSeconds = transcriptResult.durationSeconds
      } else if (metadata) {
        // Fallback to metadata
        result.transcript = [
          `Title: ${metadata.title}`,
          `Channel: ${metadata.channelTitle}`,
          `Description: ${metadata.description}`,
        ].join('\n')
        result.transcriptSource = 'metadata'
      }
    } else if (platform === 'tiktok') {
      const tikTokResult = await fetchTikTokMetadata(videoId, url)
      result.title = tikTokResult.title
      result.transcript = tikTokResult.transcript
      result.transcriptSource = tikTokResult.source
      result.transcriptConfidence = tikTokResult.confidence
    } else if (platform === 'instagram') {
      result.transcript = `Instagram video URL: ${url}`
      result.transcriptSource = 'metadata'
    }

    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch metadata'
    return Response.json({ title: '', transcript: '', transcriptSource: 'none', error: message })
  }
}
