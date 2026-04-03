// ---------------------------------------------------------------------------
// YouTube Search — channel-scoped search for trusted anime/culture content
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

/**
 * Search YouTube within an optional trusted channel.
 * Returns the best matching result or null.
 */
export async function searchYouTubeClip(
  query: string,
  channelId?: string,
): Promise<YouTubeSearchResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured')
  }

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    videoDuration: 'short',
    maxResults: '5',
    key: apiKey,
    ...(channelId ? { channelId } : {}),
  })

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
 * Search multiple queries and return all results.
 * Useful for populating a lesson with several clip options.
 */
export async function searchMultipleClips(
  queries: Array<{ query: string; channelId?: string }>,
): Promise<Array<YouTubeSearchResult | null>> {
  return Promise.all(
    queries.map(({ query, channelId }) => searchYouTubeClip(query, channelId)),
  )
}
