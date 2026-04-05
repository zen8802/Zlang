import Anthropic from '@anthropic-ai/sdk'

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface YoutubeVideo {
  videoId: string
  title: string
  channelId: string
  channelTitle: string
  thumbnail: string
  publishedAt: string
}

interface CaptionTrack {
  id: string
  language: string
  trackKind: string
  name: string
}

interface VideoDetails {
  videoId: string
  title: string
  description: string
  duration: string
  viewCount: number
  hasCaption: boolean
  defaultLanguage?: string
  defaultAudioLanguage?: string
}

interface AnalyzedClip {
  startSeconds: number
  endSeconds: number
  transcriptJP: string
  transcriptEN: string
  grammarPoints: string[]
  vocab: string[]
  jlptLevel: string
  emotion: string
  whyUseful: string
  culturalNote?: string
}

export interface MiningResult {
  channelId: string
  videosProcessed: number
  clipsFound: number
  errors: string[]
}

export interface ClipSearchParams {
  jlptLevel?: string
  grammarPoint?: string
  vocab?: string
  contentType?: string
  emotion?: string
  language?: string
  limit?: number
}

export interface MinedClip {
  id: string
  video_id: string
  channel_id: string
  channel_name: string
  video_title: string
  start_seconds: number
  end_seconds: number
  transcript_jp: string
  transcript_en: string
  grammar_points: string[]
  vocab: string[]
  jlpt_level: string
  content_type: string
  emotion: string
  language: string
  thumbnail: string
  view_count: number
}

// ---------------------------------------------------------------------------
// YouTube API Helpers
// ---------------------------------------------------------------------------

export async function getChannelVideos(
  channelId: string,
  maxResults = 50,
  pageToken?: string,
): Promise<{ videos: YoutubeVideo[]; nextPageToken?: string }> {
  const ytKey = process.env.YOUTUBE_API_KEY
  if (!ytKey) throw new Error('YOUTUBE_API_KEY not configured')

  const params = new URLSearchParams({
    part: 'snippet',
    channelId,
    type: 'video',
    order: 'date',
    maxResults: String(maxResults),
    videoEmbeddable: 'true',
    key: ytKey,
    ...(pageToken ? { pageToken } : {}),
  })

  const res = await fetch(`${YOUTUBE_API}/search?${params}`)
  const data = await res.json()

  if (!data.items) return { videos: [] }

  const videos: YoutubeVideo[] = data.items
    .filter((item: Record<string, unknown>) =>
      item.id && typeof item.id === 'object' && 'videoId' in (item.id as Record<string, unknown>),
    )
    .map((item: Record<string, Record<string, unknown>>) => ({
      videoId: item.id.videoId as string,
      title: (item.snippet?.title as string) || '',
      channelId: (item.snippet?.channelId as string) || '',
      channelTitle: (item.snippet?.channelTitle as string) || '',
      thumbnail: ((item.snippet?.thumbnails as Record<string, Record<string, string>>)?.medium?.url) || '',
      publishedAt: (item.snippet?.publishedAt as string) || '',
    }))

  return { videos, nextPageToken: data.nextPageToken }
}

export async function getVideoCaptions(videoId: string): Promise<CaptionTrack[]> {
  const ytKey = process.env.YOUTUBE_API_KEY
  if (!ytKey) throw new Error('YOUTUBE_API_KEY not configured')

  const params = new URLSearchParams({
    part: 'snippet',
    videoId,
    key: ytKey,
  })

  const res = await fetch(`${YOUTUBE_API}/captions?${params}`)
  const data = await res.json()

  if (!data.items) return []

  return data.items.map((item: Record<string, Record<string, string>>) => ({
    id: item.id as unknown as string,
    language: item.snippet?.language || '',
    trackKind: item.snippet?.trackKind || '',
    name: item.snippet?.name || '',
  }))
}

export async function getVideoDetails(videoIds: string[]): Promise<VideoDetails[]> {
  const ytKey = process.env.YOUTUBE_API_KEY
  if (!ytKey) throw new Error('YOUTUBE_API_KEY not configured')

  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: videoIds.join(','),
    key: ytKey,
  })

  const res = await fetch(`${YOUTUBE_API}/videos?${params}`)
  const data = await res.json()

  if (!data.items) return []

  return data.items.map((item: Record<string, Record<string, unknown>>) => ({
    videoId: item.id as unknown as string,
    title: (item.snippet?.title as string) || '',
    description: (item.snippet?.description as string) || '',
    duration: (item.contentDetails?.duration as string) || 'PT0S',
    viewCount: parseInt((item.statistics?.viewCount as string) || '0'),
    hasCaption: item.contentDetails?.caption === 'true',
    defaultLanguage: item.snippet?.defaultLanguage as string | undefined,
    defaultAudioLanguage: item.snippet?.defaultAudioLanguage as string | undefined,
  }))
}

export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return parseInt(match[1] || '0') * 3600 +
    parseInt(match[2] || '0') * 60 +
    parseInt(match[3] || '0')
}

// ---------------------------------------------------------------------------
// Claude Analysis
// ---------------------------------------------------------------------------

export async function analyzeVideoForClips(
  videoId: string,
  videoTitle: string,
  channelName: string,
  contentType: string,
  description: string,
  totalDuration: number,
): Promise<AnalyzedClip[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const anthropic = new Anthropic({ apiKey })

  // For short clips (under 3 min), treat the whole video as one clip
  // For longer videos, ask Claude to suggest segments
  const isShort = totalDuration <= 180

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: isShort
          ? `You are a Japanese language curriculum expert. This is a short anime clip from YouTube that we want to use for Japanese language teaching.

Video: "${videoTitle}"
Channel: ${channelName} (official ${contentType} channel)
Duration: ${totalDuration} seconds
Description: ${description.slice(0, 300)}

This is a SHORT clip (under 3 minutes). We will use the ENTIRE video as a single teaching clip.

Based on the title and description, determine what Japanese language content this clip likely contains. Think about what anime scenes with this title would teach.

Return ONLY valid JSON array with exactly 1 entry, no markdown:

[
  {
    "startSeconds": 0,
    "endSeconds": ${totalDuration},
    "transcriptJP": "Write 2-3 likely Japanese phrases/sentences that would appear in an anime clip with this title. Use natural anime Japanese.",
    "transcriptEN": "English translation of the Japanese you wrote",
    "grammarPoints": ["list 2-3 grammar points this type of scene would demonstrate"],
    "vocab": ["list 4-6 Japanese vocabulary words relevant to this scene"],
    "jlptLevel": "estimate: N5, N4, N3, N2, or N1",
    "emotion": "one of: funny, emotional, tense, casual, formal, exciting",
    "whyUseful": "one sentence on why this clip is good for learning",
    "culturalNote": "one sentence of cultural context if relevant"
  }
]`
          : `You are a Japanese language curriculum expert. This is an anime video from YouTube.

Video: "${videoTitle}"
Channel: ${channelName} (official ${contentType} channel)
Duration: ${totalDuration} seconds
Description: ${description.slice(0, 500)}

Suggest 2-3 clip segments (each 30-90 seconds) from this video that would work well for Japanese language teaching. Space them out across the video.

For each segment, estimate what Japanese dialogue and grammar it likely contains based on the title and anime context.

Return ONLY valid JSON array, no markdown:

[
  {
    "startSeconds": number,
    "endSeconds": number,
    "transcriptJP": "2-3 likely Japanese phrases for this segment",
    "transcriptEN": "English translations",
    "grammarPoints": ["2-3 grammar points"],
    "vocab": ["4-6 Japanese vocab words"],
    "jlptLevel": "N5|N4|N3|N2|N1",
    "emotion": "funny|emotional|tense|casual|formal|exciting",
    "whyUseful": "one sentence",
    "culturalNote": "one sentence if relevant"
  }
]

If this video is clearly not suitable for Japanese learning (English-only content, just music, etc.), return: []`,
      },
    ],
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Main Mining Function
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function mineChannel(
  channelId: string,
  channelName: string,
  contentType: string,
  maxVideos = 50,
): Promise<MiningResult> {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL not configured')

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(dbUrl)

  const result: MiningResult = {
    channelId,
    videosProcessed: 0,
    clipsFound: 0,
    errors: [],
  }

  try {
    const { videos } = await getChannelVideos(channelId, maxVideos)

    if (!videos.length) {
      result.errors.push('No videos found for channel')
      return result
    }

    const videoIds = videos.map((v) => v.videoId)
    const details = await getVideoDetails(videoIds)

    const eligible = details.filter((d) => {
      const duration = parseDuration(d.duration)
      const isJapanese =
        d.defaultAudioLanguage?.startsWith('ja') ||
        d.defaultLanguage?.startsWith('ja') ||
        contentType === 'anime'
      const notTooLong = duration < 600
      return isJapanese && notTooLong
    })

    for (const video of eligible) {
      try {
        const existing = await sql`
          SELECT id FROM clips WHERE video_id = ${video.videoId} LIMIT 1
        `
        if (existing.length > 0) {
          result.videosProcessed++
          continue
        }

        // For anime, skip caption check — we know it's Japanese audio
        // For non-anime, try to verify Japanese captions exist
        if (contentType !== 'anime') {
          try {
            const captions = await getVideoCaptions(video.videoId)
            const hasJPCaptions = captions.some(
              (c) => c.language === 'ja' || c.language === 'ja-JP',
            )
            if (!hasJPCaptions) continue
          } catch {
            // Caption API may require OAuth — skip check, proceed anyway
          }
        }

        const videoInfo = videos.find((v) => v.videoId === video.videoId)
        const duration = parseDuration(video.duration)

        const clips = await analyzeVideoForClips(
          video.videoId,
          video.title,
          channelName,
          contentType,
          video.description || '',
          duration,
        )

        result.videosProcessed++

        if (!clips.length) continue

        for (const clip of clips) {
          // Clamp clip times to video duration
          const start = Math.max(0, Math.min(clip.startSeconds, duration - 10))
          const end = Math.min(clip.endSeconds, duration)
          if (end <= start) continue

          const clipId = `${video.videoId}_${start}_${end}`

          await sql`
            INSERT INTO clips (
              id, video_id, channel_id, channel_name, video_title,
              start_seconds, end_seconds, transcript_jp, transcript_en,
              grammar_points, vocab, jlpt_level, content_type, emotion,
              language, thumbnail, view_count
            ) VALUES (
              ${clipId}, ${video.videoId}, ${channelId}, ${channelName},
              ${video.title}, ${start}, ${end},
              ${clip.transcriptJP}, ${clip.transcriptEN},
              ${clip.grammarPoints}, ${clip.vocab},
              ${clip.jlptLevel}, ${contentType}, ${clip.emotion},
              'japanese', ${videoInfo?.thumbnail || ''}, ${video.viewCount}
            )
            ON CONFLICT (id) DO NOTHING
          `
          result.clipsFound++
        }

        await sleep(500)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        result.errors.push(`Video ${video.videoId}: ${msg}`)
        result.videosProcessed++
      }
    }

    await sql`
      UPDATE channel_registry
      SET last_mined = NOW(), total_clips = total_clips + ${result.clipsFound}
      WHERE channel_id = ${channelId}
    `
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    result.errors.push(msg)
  }

  return result
}

// ---------------------------------------------------------------------------
// Search Function
// ---------------------------------------------------------------------------

export async function searchClips(params: ClipSearchParams): Promise<MinedClip[]> {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL not configured')

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(dbUrl)

  const {
    jlptLevel,
    grammarPoint,
    vocab,
    contentType,
    emotion,
    language = 'japanese',
    limit = 5,
  } = params

  // Use parameterized tagged template queries
  // Chain conditions with coalesce pattern
  const clips = await sql`
    SELECT * FROM clips
    WHERE language = ${language}
    AND embeddable = true
    AND (${jlptLevel} IS NULL OR jlpt_level = ${jlptLevel || null})
    AND (${contentType} IS NULL OR content_type = ${contentType || null})
    AND (${emotion} IS NULL OR emotion = ${emotion || null})
    AND (${grammarPoint} IS NULL OR grammar_points @> ARRAY[${grammarPoint || ''}]::text[])
    AND (${vocab} IS NULL OR vocab @> ARRAY[${vocab || ''}]::text[])
    ORDER BY view_count DESC
    LIMIT ${limit}
  `

  return clips as MinedClip[]
}
