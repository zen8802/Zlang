import { transcribeAudioUrl, uploadAudioToAssemblyAI } from '@/lib/transcript-fetcher'

export async function POST(req: Request) {
  if (!process.env.ASSEMBLYAI_API_KEY) {
    return Response.json({ error: 'ASSEMBLYAI_API_KEY not configured' }, { status: 500 })
  }

  try {
    const contentType = req.headers.get('content-type') || ''

    // Option 1: Client sends raw audio data
    if (contentType.includes('octet-stream') || contentType.includes('audio')) {
      const buffer = Buffer.from(await req.arrayBuffer())
      console.log('[Transcribe] Received audio upload:', buffer.length, 'bytes')

      // Upload to AssemblyAI
      const uploadUrl = await uploadAudioToAssemblyAI(buffer)
      if (!uploadUrl) {
        return Response.json({ error: 'Failed to upload audio' }, { status: 500 })
      }

      // Transcribe
      const result = await transcribeAudioUrl(uploadUrl)
      if (!result) {
        return Response.json({ error: 'Transcription failed' }, { status: 500 })
      }

      return Response.json({
        transcript: result.transcript,
        segments: result.segments,
        language: result.language,
        source: result.source,
        confidence: result.confidence,
        durationSeconds: result.durationSeconds,
      })
    }

    // Option 2: Client sends a direct audio URL
    const { audioUrl } = await req.json()
    if (!audioUrl) {
      return Response.json({ error: 'Provide audioUrl or raw audio data' }, { status: 400 })
    }

    const result = await transcribeAudioUrl(audioUrl)
    if (!result) {
      return Response.json({ error: 'Transcription failed' }, { status: 500 })
    }

    return Response.json({
      transcript: result.transcript,
      segments: result.segments,
      language: result.language,
      source: result.source,
      confidence: result.confidence,
      durationSeconds: result.durationSeconds,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
