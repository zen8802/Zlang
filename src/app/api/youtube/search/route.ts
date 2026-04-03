import { NextRequest } from 'next/server'
import {
  searchYouTubeClip,
  TRUSTED_CHANNELS,
  type YouTubeSearchResult,
} from '@/lib/youtube-search'

export async function POST(req: NextRequest) {
  if (!process.env.YOUTUBE_API_KEY) {
    return Response.json(
      { error: 'YouTube API key not configured' },
      { status: 500 },
    )
  }

  try {
    const { query, channelId, channelKey } = await req.json()

    if (!query || typeof query !== 'string') {
      return Response.json(
        { error: 'Missing or invalid "query" parameter' },
        { status: 400 },
      )
    }

    // Resolve channel ID: prefer explicit channelId, then look up by key
    let resolvedChannelId: string | undefined = channelId
    if (
      !resolvedChannelId &&
      channelKey &&
      channelKey in TRUSTED_CHANNELS
    ) {
      resolvedChannelId =
        TRUSTED_CHANNELS[channelKey as keyof typeof TRUSTED_CHANNELS]
    }

    const result: YouTubeSearchResult | null = await searchYouTubeClip(
      query,
      resolvedChannelId,
    )

    if (!result) {
      return Response.json(
        { error: 'No results found', query, channelId: resolvedChannelId },
        { status: 404 },
      )
    }

    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
