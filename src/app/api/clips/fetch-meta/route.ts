import { fetchYouTubeTranscript, fetchTikTokMetadata } from '@/lib/transcript-fetcher'

export async function POST(req: Request) {
  try {
    const { url, platform, videoId } = await req.json()

    let title = ''
    let transcript = ''

    if (platform === 'youtube' || platform === 'youtube-shorts') {
      const result = await fetchYouTubeTranscript(videoId)
      title = result.title
      transcript = result.transcript
    } else if (platform === 'tiktok') {
      const result = await fetchTikTokMetadata(videoId, url)
      title = result.title
      transcript = result.transcript
    } else if (platform === 'instagram') {
      transcript = `Instagram video URL: ${url}`
    }

    return Response.json({ title, transcript })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch metadata'
    return Response.json({ title: '', transcript: '', error: message })
  }
}
