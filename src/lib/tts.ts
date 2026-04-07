import { ElevenLabsClient } from 'elevenlabs'

export const DEFAULT_VOICE_ID = 'JOcmGzB8OFjY8MhjHHEf'

interface TTSOptions {
  voiceId: string
  text: string
  emotion?: 'neutral' | 'excited' | 'nervous' | 'gruff' | 'warm' | 'tired'
}

export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured')

  const client = new ElevenLabsClient({ apiKey })
  const { voiceId, text, emotion = 'neutral' } = options

  const settings: Record<string, { stability: number; similarity_boost: number; style: number }> = {
    neutral: { stability: 0.5, similarity_boost: 0.75, style: 0.0 },
    excited: { stability: 0.3, similarity_boost: 0.75, style: 0.6 },
    nervous: { stability: 0.4, similarity_boost: 0.70, style: 0.3 },
    gruff: { stability: 0.6, similarity_boost: 0.80, style: 0.2 },
    warm: { stability: 0.5, similarity_boost: 0.80, style: 0.4 },
    tired: { stability: 0.7, similarity_boost: 0.75, style: 0.1 },
  }

  const voiceSettings = settings[emotion]

  const audio = await client.textToSpeech.convert(voiceId, {
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: voiceSettings.stability,
      similarity_boost: voiceSettings.similarity_boost,
      style: voiceSettings.style,
      use_speaker_boost: true,
    },
  })

  const chunks: Buffer[] = []
  for await (const chunk of audio) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export function detectEmotion(
  text: string,
  coachNote: string,
  characterDescription: string,
): TTSOptions['emotion'] {
  const combined = (text + coachNote + characterDescription).toLowerCase()

  if (combined.includes('excited') || text.includes('！！') || text.includes('すごい') || text.includes('やった')) return 'excited'
  if (combined.includes('nervous') || combined.includes('緊張') || combined.includes('ちょっと')) return 'nervous'
  if (combined.includes('gruff') || combined.includes('no-nonsense') || combined.includes('impatient')) return 'gruff'
  if (combined.includes('warm') || combined.includes('kind') || combined.includes('sweet') || combined.includes('gentle')) return 'warm'
  if (combined.includes('tired') || combined.includes('exhausted') || combined.includes('sleepy')) return 'tired'
  return 'neutral'
}
