import { generateSpeech, detectEmotion, DEFAULT_VOICE_ID } from '@/lib/tts'

export async function POST(req: Request) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return new Response('ELEVENLABS_API_KEY not configured', { status: 500 })
  }

  try {
    const { text, voiceId, characterDescription, coachNote } = await req.json()

    if (!text?.trim()) {
      return new Response('No text provided', { status: 400 })
    }

    // Strip furigana readings for cleaner speech
    const cleanText = text.replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')

    const emotion = detectEmotion(cleanText, coachNote || '', characterDescription || '')

    const audioBuffer = await generateSpeech({
      voiceId: voiceId || DEFAULT_VOICE_ID,
      text: cleanText,
      emotion,
    })

    return new Response(new Uint8Array(audioBuffer) as unknown as BodyInit, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TTS failed'
    console.error('[TTS]', message)
    return new Response(message, { status: 500 })
  }
}
