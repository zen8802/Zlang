import { searchClips } from '@/lib/clip-miner'

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
  }

  try {
    const params = await req.json()
    const clips = await searchClips(params)

    if (!clips.length) {
      return Response.json({
        clips: [],
        message: 'No clips found for these parameters. Try broader filters.',
      })
    }

    const clipsWithEmbed = clips.map((clip) => ({
      ...clip,
      embedUrl: `https://www.youtube.com/embed/${clip.video_id}?start=${clip.start_seconds}&end=${clip.end_seconds}&autoplay=1&rel=0&modestbranding=1`,
    }))

    return Response.json({ clips: clipsWithEmbed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
