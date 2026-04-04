// ---------------------------------------------------------------------------
// YouTube Search — channel-scoped search with fallback
// ---------------------------------------------------------------------------

export const TRUSTED_CHANNELS = {
  crunchyroll: 'UC6pGDc4bFGD1_36IKv3FnYg',
  crunchyrollCollection: 'UCVykmpSgNqBGRFAqGHmj0Rg',
  nhkWorldJapan: 'UCSmSHXktPPDgDkbYyMagb4w',
} as const

export type TrustedChannelKey = keyof typeof TRUSTED_CHANNELS

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
  channelId?: string,
): URLSearchParams {
  const params: Record<string, string> = {
    part: 'snippet',
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    maxResults: '5',
    key: apiKey,
  }
  if (channelId) {
    params.channelId = channelId
  }
  return new URLSearchParams(params)
}

async function fetchSearch(
  params: URLSearchParams,
): Promise<YouTubeSearchResult | null> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`YouTube API error ${res.status}: ${text}`)
  }

  const data = await res.json()

  if (!data.items || data.items.length === 0) {
    return null
  }

  const item = data.items[0]
  return {
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl:
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.medium?.url ||
      item.snippet.thumbnails?.default?.url ||
      '',
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
  }
}

/**
 * Search YouTube for a clip. Tries channel-scoped first,
 * falls back to unscoped search if no results.
 */
export async function searchYouTubeClip(
  query: string,
  channelId?: string,
): Promise<YouTubeSearchResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured')
  }

  // Try channel-scoped search first
  if (channelId) {
    const channelParams = buildSearchParams(query, apiKey, channelId)
    const channelResult = await fetchSearch(channelParams)
    if (channelResult) return channelResult
  }

  // Fallback: search without channel filter
  const openParams = buildSearchParams(query, apiKey)
  return fetchSearch(openParams)
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
