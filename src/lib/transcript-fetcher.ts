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
// Layer 1: YouTube captions via youtube-transcript package
// ---------------------------------------------------------------------------

async function tryYouTubeCaptions(
  videoId: string,
): Promise<TranscriptResult | null> {
  try {
    let YoutubeTranscript: {
      fetchTranscript: (
        id: string,
        opts?: { lang?: string },
      ) => Promise<Array<{ text: string; offset: number; duration: number }>>
    } | null = null

    try {
      const mod = await import('youtube-transcript')
      YoutubeTranscript = mod.YoutubeTranscript || null
    } catch {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('youtube-transcript')
        YoutubeTranscript = mod.YoutubeTranscript || null
      } catch {
        // Package not available
      }
    }

    if (!YoutubeTranscript?.fetchTranscript) return null

    // Try Japanese captions first
    try {
      const jpSegments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ja' })
      if (jpSegments?.length > 0) {
        const text = jpSegments.map((s) => s.text).join(' ')
        const jpChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g)
        if (jpChars && jpChars.length > 5) {
          return {
            transcript: text,
            segments: jpSegments.map((s) => ({
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
      // JP captions not available
    }

    // Try auto-generated captions
    try {
      const autoSegments = await YoutubeTranscript.fetchTranscript(videoId)
      if (autoSegments?.length > 0) {
        const text = autoSegments.map((s) => s.text).join(' ')
        const jpChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g)
        if (jpChars && jpChars.length > 5) {
          return {
            transcript: text,
            segments: autoSegments.map((s) => ({
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
// Layer 2: AssemblyAI — requires audio URL passed from client
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAssemblyResult(transcript: any): TranscriptResult {
  const segments: TranscriptSegment[] = []
  const words = transcript.words as
    | Array<{ text: string; start: number; end: number }>
    | undefined

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

/**
 * Transcribe audio that's already been uploaded or has a direct URL.
 * Called from the client-upload flow.
 */
export async function transcribeAudioUrl(audioUrl: string): Promise<TranscriptResult | null> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY
  if (!apiKey) {
    console.log('[Transcript] No ASSEMBLYAI_API_KEY')
    return null
  }

  try {
    const assembly = new AssemblyAI({ apiKey })

    console.log('[Transcript] Sending audio URL to AssemblyAI...')

    const transcript = await assembly.transcripts.transcribe({
      audio_url: audioUrl,
      language_code: 'ja',
      speech_models: ['universal-3-pro', 'universal-2'],
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

    const jpChars = transcript.text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g)
    if (!jpChars || jpChars.length < 5) {
      console.log('[Transcript] Not Japanese, retrying with auto-detect...')
      const retry = await assembly.transcripts.transcribe({
        audio_url: audioUrl,
        language_detection: true,
        speech_models: ['universal-3-pro', 'universal-2'],
        punctuate: true,
        format_text: true,
      })

      if (retry.text) {
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

/**
 * Upload raw audio data to AssemblyAI and get upload URL back.
 */
export async function uploadAudioToAssemblyAI(audioBuffer: ArrayBuffer | Buffer): Promise<string | null> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'content-type': 'application/octet-stream',
      },
      body: (audioBuffer instanceof ArrayBuffer ? new Uint8Array(audioBuffer) : new Uint8Array(audioBuffer.buffer)) as unknown as BodyInit,
    })

    const data = await res.json() as { upload_url?: string }
    return data.upload_url || null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Main export — caption-only pipeline (AssemblyAI handled separately)
// ---------------------------------------------------------------------------

export async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptResult> {
  console.log(`[Transcript] Starting pipeline for: ${videoId}`)

  // Layer 1: YouTube captions (fast, free)
  console.log('[Transcript] Layer 1: Trying YouTube captions...')
  const captions = await tryYouTubeCaptions(videoId)
  if (captions) {
    console.log(
      `[Transcript] Captions found (${captions.segments.length} segments, ${captions.transcript.length} chars)`,
    )
    return captions
  }

  // Layer 2: No captions available — return empty
  // AssemblyAI transcription is handled via client-side audio upload flow
  console.log('[Transcript] No captions found. Client-side audio upload needed for transcription.')
  return {
    transcript: '',
    segments: [],
    language: 'unknown',
    source: 'none',
    confidence: 'low',
    title: '',
  }
}

// TikTok metadata
export async function fetchTikTokMetadata(
  videoId: string,
  originalUrl: string,
): Promise<TranscriptResult> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(originalUrl)}`,
    )
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
    return {
      transcript: '',
      segments: [],
      language: 'unknown',
      source: 'none',
      confidence: 'low',
      title: '',
    }
  }
}
