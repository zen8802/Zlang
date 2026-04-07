// ---------------------------------------------------------------------------
// YouTube Search — Japanese-first, channel-scoped with smart fallback
// ---------------------------------------------------------------------------

export const TRUSTED_CHANNELS = {
  crunchyroll: 'UC6pGDc4bFGD1_36IKv3FnYg',
  crunchyrollCollection: 'UCVykmpSgNqBGRFAqGHmj0Rg',
  nhkWorldJapan: 'UCSmSHXktPPDgDkbYyMagb4w',
  // Japanese-native channels (always JP audio)
  toeiAnimation: 'UCuU4v9kVr4iKnBWxSqKcXOQ',
  museAsia: 'UCszoNXjkjMW2bEXFQHuTQtQ',
} as const

export type TrustedChannelKey = keyof typeof TRUSTED_CHANNELS

// Channels that always have Japanese audio
const JAPANESE_AUDIO_CHANNELS: Set<string> = new Set([
  TRUSTED_CHANNELS.crunchyrollCollection,
  TRUSTED_CHANNELS.toeiAnimation,
  TRUSTED_CHANNELS.museAsia,
  TRUSTED_CHANNELS.nhkWorldJapan,
])

export interface YouTubeSearchResult {
  videoId: string
  title: string
  description: string
  thumbnailUrl: string
  channelTitle: string
  publishedAt: string
}

function buildSearchParams(
  query: string,
  apiKey: string,
  options?: {
    channelId?: string
    relevanceLanguage?: string
    maxResults?: number
  },
): URLSearchParams {
  const params: Record<string, string> = {
    part: 'snippet',
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    maxResults: String(options?.maxResults || 5),
    key: apiKey,
  }
  if (options?.channelId) {
    params.channelId = options.channelId
  }
  if (options?.relevanceLanguage) {
    params.relevanceLanguage = options.relevanceLanguage
  }
  return new URLSearchParams(params)
}

async function fetchSearch(
  params: URLSearchParams,
): Promise<YouTubeSearchResult[]> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`YouTube API error ${res.status}: ${text}`)
  }

  const data = await res.json()

  if (!data.items || data.items.length === 0) {
    return []
  }

  return data.items.map((item: Record<string, Record<string, unknown>>) => ({
    videoId: (item.id as Record<string, string>).videoId,
    title: (item.snippet?.title as string) || '',
    description: (item.snippet?.description as string) || '',
    thumbnailUrl:
      ((item.snippet?.thumbnails as Record<string, Record<string, string>>)?.high?.url) ||
      ((item.snippet?.thumbnails as Record<string, Record<string, string>>)?.medium?.url) ||
      '',
    channelTitle: (item.snippet?.channelTitle as string) || '',
    publishedAt: (item.snippet?.publishedAt as string) || '',
  }))
}

// Filter results that look like English dubs or lesson videos
function isLikelyJapaneseAudio(result: YouTubeSearchResult): boolean {
  const title = result.title.toLowerCase()
  const desc = result.description.toLowerCase()

  // Reject if title explicitly says English dub
  const dubIndicators = ['english dub', 'eng dub', 'dubbed', 'dub |', '| dub', '(dub)', '[dub]']
  if (dubIndicators.some(d => title.includes(d))) return false

  // Reject lesson/tutorial videos
  const lessonIndicators = ['lesson', 'tutorial', 'learn japanese', 'how to say', 'japanese for beginners', 'jlpt prep']
  if (lessonIndicators.some(l => title.includes(l) || desc.includes(l))) return false

  // Prefer if title has Japanese characters (suggests JP content)
  const hasJP = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/.test(result.title)

  // Prefer if title mentions sub/subtitle (means JP audio + subs)
  const subIndicators = ['sub', 'subtitled', 'jp', 'japanese audio']
  const mentionsSub = subIndicators.some(s => title.includes(s))

  return hasJP || mentionsSub || true // accept if not explicitly dubbed
}

/**
 * Search YouTube for Japanese-audio clips.
 * Strategy:
 * 1. Try Japanese-native channels first (guaranteed JP audio)
 * 2. Try Crunchyroll Collection (JP subtitled clips)
 * 3. Try Crunchyroll main (mixed, filter out dubs)
 * 4. Fallback: general search with JP language preference + "日本語" appended
 */
export async function searchYouTubeClip(
  query: string,
  channelId?: string,
  language: 'japanese' | 'english' = 'japanese',
): Promise<YouTubeSearchResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured')
  }

  // If a specific channel is requested, search there first
  if (channelId) {
    const results = await fetchSearch(
      buildSearchParams(query, apiKey, { channelId }),
    )
    // If it's a known JP-audio channel, trust any result
    if (JAPANESE_AUDIO_CHANNELS.has(channelId) && results.length > 0) {
      return results[0]
    }
    // Otherwise filter for JP audio indicators
    const jpResult = results.find(isLikelyJapaneseAudio)
    if (jpResult) return jpResult
  }

  if (language === 'japanese') {
    // Strategy for Japanese clips:

    // 1. Try Crunchyroll Collection (JP subtitled, always JP audio)
    const collectionResults = await fetchSearch(
      buildSearchParams(query, apiKey, {
        channelId: TRUSTED_CHANNELS.crunchyrollCollection,
      }),
    )
    if (collectionResults.length > 0) return collectionResults[0]

    // 2. Try Crunchyroll main, filter out dubs
    const crResults = await fetchSearch(
      buildSearchParams(query, apiKey, {
        channelId: TRUSTED_CHANNELS.crunchyroll,
      }),
    )
    const jpCrResult = crResults.find(isLikelyJapaneseAudio)
    if (jpCrResult) return jpCrResult

    // 3. General search with Japanese language preference
    const jpQuery = query + ' 日本語 anime'
    const openResults = await fetchSearch(
      buildSearchParams(jpQuery, apiKey, { relevanceLanguage: 'ja' }),
    )
    const jpOpenResult = openResults.find(isLikelyJapaneseAudio)
    if (jpOpenResult) return jpOpenResult

    // 4. Last resort: any result from original query with JP preference
    const lastResults = await fetchSearch(
      buildSearchParams(query, apiKey, { relevanceLanguage: 'ja' }),
    )
    return lastResults.find(isLikelyJapaneseAudio) || lastResults[0] || null
  }

  // English clips — simpler, just search normally
  const enResults = await fetchSearch(
    buildSearchParams(query, apiKey, { relevanceLanguage: 'en' }),
  )
  return enResults[0] || null
}

/**
 * Search multiple queries and return all results.
 */
export async function searchMultipleClips(
  queries: Array<{ query: string; channelId?: string }>,
): Promise<Array<YouTubeSearchResult | null>> {
  return Promise.all(
    queries.map(({ query, channelId }) => searchYouTubeClip(query, channelId)),
  )
}
