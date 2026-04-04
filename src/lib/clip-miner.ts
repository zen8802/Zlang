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

export async function analyzeTranscriptForClips(
  videoId: string,
  videoTitle: string,
  channelName: string,
  contentType: string,
  transcript: string,
  totalDuration: number,
): Promise<AnalyzedClip[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const anthropic = new Anthropic({ apiKey })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a Japanese language curriculum expert analyzing a YouTube video transcript to find teachable moments.

Video: "${videoTitle}"
Channel: ${channelName}
Type: ${contentType}
Duration: ${totalDuration} seconds
Transcript/Context: ${transcript}

Find 2-4 segments (30-90 seconds each) that contain genuinely useful Japanese language for learners.

Look for segments with:
- Natural conversational Japanese (not just action sounds)
- Clear grammar patterns that can be taught
- Emotionally memorable moments (funny, dramatic, heartwarming)
- Cultural context worth explaining
- Actual dialogue, not just narration

Return ONLY valid JSON array, no markdown:

[
  {
    "startSeconds": 45,
    "endSeconds": 90,
    "transcriptJP": "exact Japanese text in this segment",
    "transcriptEN": "your English translation",
    "grammarPoints": ["te-form", "masu-form"],
    "vocab": ["specific", "words", "worth", "teaching"],
    "jlptLevel": "N4",
    "emotion": "funny",
    "whyUseful": "one sentence on pedagogical value",
    "culturalNote": "optional cultural context"
  }
]

If the transcript has no useful teachable Japanese (just music, sound effects, English only, or incomprehensible noise), return an empty array: []`,
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
  maxVideos = 25,
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
        if (existing.length > 0) continue

        const captions = await getVideoCaptions(video.videoId)
        const hasJPCaptions = captions.some(
          (c) => c.language === 'ja' || c.language === 'ja-JP',
        )

        if (!hasJPCaptions && contentType !== 'anime') continue

        const videoInfo = videos.find((v) => v.videoId === video.videoId)
        const transcriptContext = `
Title: ${video.title}
Description: ${video.description?.slice(0, 500) || 'No description'}
Duration: ${parseDuration(video.duration)} seconds
Has Japanese captions: ${hasJPCaptions}
`.trim()

        const clips = await analyzeTranscriptForClips(
          video.videoId,
          video.title,
          channelName,
          contentType,
          transcriptContext,
          parseDuration(video.duration),
        )

        if (!clips.length) continue

        for (const clip of clips) {
          const clipId = `${video.videoId}_${clip.startSeconds}_${clip.endSeconds}`

          await sql`
            INSERT INTO clips (
              id, video_id, channel_id, channel_name, video_title,
              start_seconds, end_seconds, transcript_jp, transcript_en,
              grammar_points, vocab, jlpt_level, content_type, emotion,
              language, thumbnail, view_count
            ) VALUES (
              ${clipId}, ${video.videoId}, ${channelId}, ${channelName},
              ${video.title}, ${clip.startSeconds}, ${clip.endSeconds},
              ${clip.transcriptJP}, ${clip.transcriptEN},
              ${clip.grammarPoints}, ${clip.vocab},
              ${clip.jlptLevel}, ${contentType}, ${clip.emotion},
              'japanese', ${videoInfo?.thumbnail || ''}, ${video.viewCount}
            )
            ON CONFLICT (id) DO NOTHING
          `
          result.clipsFound++
        }

        result.videosProcessed++
        await sleep(500)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        result.errors.push(`Video ${video.videoId}: ${msg}`)
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
