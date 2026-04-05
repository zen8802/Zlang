import { AssemblyAI } from 'assemblyai'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TranscriptResult {
  transcript: string
  segments: TranscriptSegment[]
  language: 'ja' | 'en' | 'unknown'
  source: 'captions' | 'assemblyai' | 'metadata' | 'none'
  confidence: 'high' | 'medium' | 'low'
  durationSeconds?: number
  title: string
}

export interface TranscriptSegment {
  text: string
  start: number
  duration: number
}

// ---------------------------------------------------------------------------
// Layer 1: YouTube captions via youtube-transcript
// ---------------------------------------------------------------------------

async function tryYouTubeCaptions(
  videoId: string,
): Promise<TranscriptResult | null> {
  try {
    // Dynamic import — this package has CJS/ESM quirks
    const mod = await import('youtube-transcript')
    const YoutubeTranscript = mod.YoutubeTranscript

    if (!YoutubeTranscript?.fetchTranscript) return null

    // Try Japanese captions
    try {
      const jpSegments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ja' })
      if (jpSegments?.length > 0) {
        const text = jpSegments.map((s: { text: string }) => s.text).join(' ')
        const jpChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g)
        if (jpChars && jpChars.length > 5) {
          return {
            transcript: text,
            segments: jpSegments.map((s: { text: string; offset: number; duration: number }) => ({
              text: s.text,
              start: s.offset / 1000,
              duration: s.duration / 1000,
            })),
            language: 'ja',
            source: 'captions',
            confidence: 'high',
            title: '',
          }
        }
      }
    } catch {
      // JP captions not available, try auto
    }

    // Try auto-generated captions
    try {
      const autoSegments = await YoutubeTranscript.fetchTranscript(videoId)
      if (autoSegments?.length > 0) {
        const text = autoSegments.map((s: { text: string }) => s.text).join(' ')
        const jpChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g)
        if (jpChars && jpChars.length > 5) {
          return {
            transcript: text,
            segments: autoSegments.map((s: { text: string; offset: number; duration: number }) => ({
              text: s.text,
              start: s.offset / 1000,
              duration: s.duration / 1000,
            })),
            language: 'ja',
            source: 'captions',
            confidence: 'medium',
            title: '',
          }
        }
      }
    } catch {
      // No captions at all
    }

    return null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Layer 2: AssemblyAI audio transcription
// ---------------------------------------------------------------------------

async function tryAssemblyAI(videoId: string): Promise<TranscriptResult | null> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY
  if (!apiKey) {
    console.log('[Transcript] No ASSEMBLYAI_API_KEY configured, skipping')
    return null
  }

  try {
    const assembly = new AssemblyAI({ apiKey })
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`

    console.log('[Transcript] Sending to AssemblyAI...')

    const transcript = await assembly.transcripts.transcribe({
      audio_url: youtubeUrl,
      language_code: 'ja',
      speech_model: 'best',
      punctuate: true,
      format_text: true,
    })

    if (transcript.status === 'error') {
      console.error('[Transcript] AssemblyAI error:', transcript.error)
      return null
    }

    if (!transcript.text || transcript.text.trim().length === 0) {
      console.log('[Transcript] AssemblyAI returned empty text')
      return null
    }

    // Verify it's Japanese
    const jpChars = transcript.text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g)
    if (!jpChars || jpChars.length < 5) {
      console.log('[Transcript] AssemblyAI text not Japanese, retrying with auto-detect...')

      const retry = await assembly.transcripts.transcribe({
        audio_url: youtubeUrl,
        language_detection: true,
        speech_model: 'best',
        punctuate: true,
        format_text: true,
      })

      if (retry.text && retry.language_code === 'ja') {
        return buildAssemblyResult(retry)
      }
      return null
    }

    return buildAssemblyResult(transcript)
  } catch (err) {
    console.error('[Transcript] AssemblyAI failed:', err)
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAssemblyResult(transcript: any): TranscriptResult {
  const segments: TranscriptSegment[] = []
  const words = transcript.words as Array<{ text: string; start: number; end: number }> | undefined

  if (words?.length) {
    let currentSegment: string[] = []
    let segmentStart = words[0].start / 1000

    words.forEach((word, i) => {
      currentSegment.push(word.text)

      const isEnd =
        word.text.includes('。') ||
        word.text.includes('！') ||
        word.text.includes('？') ||
        currentSegment.length >= 15 ||
        i === words.length - 1

      if (isEnd) {
        segments.push({
          text: currentSegment.join(''),
          start: segmentStart,
          duration: word.end / 1000 - segmentStart,
        })
        currentSegment = []
        if (i < words.length - 1) {
          segmentStart = words[i + 1].start / 1000
        }
      }
    })
  }

  return {
    transcript: transcript.text || '',
    segments,
    language: 'ja',
    source: 'assemblyai',
    confidence: 'high',
    durationSeconds: transcript.audio_duration,
    title: '',
  }
}

// ---------------------------------------------------------------------------
// Main export — three-layer pipeline
// ---------------------------------------------------------------------------

export async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptResult> {
  console.log(`[Transcript] Starting pipeline for: ${videoId}`)

  // Layer 1: YouTube captions (fast, free)
  console.log('[Transcript] Layer 1: Trying YouTube captions...')
  const captions = await tryYouTubeCaptions(videoId)
  if (captions) {
    console.log(`[Transcript] Captions found (${captions.segments.length} segments, ${captions.transcript.length} chars)`)
    return captions
  }

  // Layer 2: AssemblyAI (slower, costs API credits but always works)
  console.log('[Transcript] Layer 2: Trying AssemblyAI...')
  const assemblyResult = await tryAssemblyAI(videoId)
  if (assemblyResult) {
    console.log(`[Transcript] AssemblyAI succeeded (${assemblyResult.transcript.length} chars)`)
    return assemblyResult
  }

  // Layer 3: Nothing worked
  console.log('[Transcript] All layers failed, returning empty')
  return {
    transcript: '',
    segments: [],
    language: 'unknown',
    source: 'none',
    confidence: 'low',
    title: '',
  }
}

// TikTok metadata (no transcription available)
export async function fetchTikTokMetadata(videoId: string, originalUrl: string): Promise<TranscriptResult> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(originalUrl)}`)
    const data = await res.json()
    return {
      transcript: `TikTok: ${data.title || 'No title'}`,
      segments: [],
      language: 'unknown',
      source: 'metadata',
      confidence: 'low',
      title: data.title || '',
    }
  } catch {
    return { transcript: '', segments: [], language: 'unknown', source: 'none', confidence: 'low', title: '' }
  }
}
