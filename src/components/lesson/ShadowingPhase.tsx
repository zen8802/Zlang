'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import LoadingHaiku from './LoadingHaiku'
import { useStreamingFetch } from '@/lib/useStreamingFetch'
import { useAppStore } from '@/store/useAppStore'
import { getClipById } from '@/data/clips'

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number }
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionInstance {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  start: () => void
  stop: () => void
}

interface ShadowingResult {
  rhythmScore: number
  stressScore: number
  naturalnessScore: number
  overallStars: number
  feedback: string
  tips: string[]
  encouragement: string
}

interface ShadowingPhaseProps {
  clipId: string
  onComplete: (stars: number) => void
}

// Generate consistent random waveform segments for visual comparison
function generateWaveform(seed: number, length: number = 40): number[] {
  const segments: number[] = []
  let val = 0.5
  for (let i = 0; i < length; i++) {
    val += (Math.sin(seed * i * 0.3) * 0.3 + Math.cos(seed * i * 0.7) * 0.2)
    val = Math.max(0.1, Math.min(1, val))
    segments.push(val)
  }
  return segments
}

export default function ShadowingPhase({
  clipId,
  onComplete,
}: ShadowingPhaseProps) {
  const [stage, setStage] = useState<'ready' | 'recording' | 'grading' | 'result'>('ready')
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState<ShadowingResult | null>(null)
  const [originalWave] = useState(() => generateWaveform(42))
  const [userWave] = useState(() => generateWaveform(17))

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const { content, isLoading, fetchStream } = useStreamingFetch()
  const corridor = useAppStore((s) => s.corridor)
  const level = useAppStore((s) => s.level)

  const clip = getClipById(clipId)
  const targetLanguage = corridor === 'en-to-jp' ? 'Japanese' : 'English'

  // Parse result from streamed JSON
  useEffect(() => {
    if (!content || isLoading) return

    try {
      let cleaned = content.trim()
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
      if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
      cleaned = cleaned.trim()

      const parsed = JSON.parse(cleaned) as ShadowingResult
      if (parsed.overallStars !== undefined) {
        setResult(parsed)
        setStage('result')
      }
    } catch {
      // Not yet complete or parse error
      if (!isLoading && content.length > 20) {
        // Fallback: create a default result
        setResult({
          rhythmScore: 3,
          stressScore: 3,
          naturalnessScore: 3,
          overallStars: 3,
          feedback: content,
          tips: [],
          encouragement: 'Keep practicing!',
        })
        setStage('result')
      }
    }
  }, [content, isLoading])

  const startRecording = useCallback(() => {
    // Use Web Speech API for speech recognition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      // Fallback for browsers without Speech API
      setTranscript('(Speech recognition not available in this browser)')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = corridor === 'en-to-jp' ? 'ja-JP' : 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognitionRef.current = recognition
    setTranscript('')
    setStage('recording')

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript
      }
      setTranscript(finalTranscript)
    }

    recognition.onend = () => {
      setStage('ready')
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setStage('ready')
    }

    recognition.start()

    // Auto-stop after 10 seconds
    setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }, 10000)
  }, [corridor])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setStage('ready')
  }, [])

  const submitShadowing = useCallback(async () => {
    if (!transcript.trim()) return

    setStage('grading')

    await fetchStream({
      action: 'grade-shadowing',
      corridor,
      level,
      original: clip?.transcript || '',
      userAttempt: transcript,
      targetLanguage,
    })
  }, [fetchStream, corridor, level, clip, transcript, targetLanguage])

  const handleTryAgain = useCallback(() => {
    setResult(null)
    setTranscript('')
    setStage('ready')
  }, [])

  const renderStars = (count: number, max: number = 5) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <motion.svg
            key={i}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
          >
            <path
              d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 13.88l-4.94 2.82.94-5.49-4-3.9 5.53-.8L10 1.5z"
              fill={i < count ? '#1B4F8A' : 'rgba(255,255,255,0.1)'}
              stroke={i < count ? '#1B4F8A' : 'rgba(255,255,255,0.15)'}
              strokeWidth="0.5"
            />
          </motion.svg>
        ))}
      </div>
    )
  }

  const renderWaveform = (
    segments: number[],
    color: string,
    label: string,
  ) => (
    <div className="space-y-1.5">
      <p className="text-[10px] text-foreground/30 uppercase tracking-wider">{label}</p>
      <div className="flex items-end gap-[2px] h-10">
        {segments.map((height, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: '3px',
              backgroundColor: color,
              opacity: 0.5 + height * 0.5,
            }}
            initial={{ height: 0 }}
            animate={{ height: `${height * 100}%` }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Phase header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs text-accent uppercase tracking-[0.2em] mb-1">Phase 3</p>
        <h2 className="text-2xl font-display font-bold text-foreground">Shadowing</h2>
        <p className="text-sm text-foreground/40 mt-1">
          Repeat what you heard. Match the rhythm and tone.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Ready / Recording stage */}
        {(stage === 'ready' || stage === 'recording') && (
          <motion.div
            key="recording"
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            {/* Target text to shadow */}
            <motion.div className="glass-card p-8 text-center">
              <p className={`text-3xl font-jp font-bold leading-relaxed ${
                corridor === 'en-to-jp' ? 'text-accent-jp' : 'text-accent-en'
              }`}>
                {clip?.transcript || 'Loading...'}
              </p>
              <p className="text-sm text-foreground/40 mt-3">
                {clip?.translation || ''}
              </p>
            </motion.div>

            {/* Microphone button */}
            <div className="flex flex-col items-center gap-4">
              <motion.button
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                  stage === 'recording'
                    ? 'bg-red-500/20 border-2 border-red-500/60'
                    : 'bg-accent/10 border-2 border-accent/40 hover:bg-accent/20'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stage === 'recording' ? stopRecording : startRecording}
                aria-label={stage === 'recording' ? 'Stop recording' : 'Start recording'}
              >
                {/* Pulse ring for recording */}
                {stage === 'recording' && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-red-500/40"
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                {/* Microphone icon */}
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={stage === 'recording' ? 'text-red-400' : 'text-accent'}
                >
                  {stage === 'recording' ? (
                    // Stop icon
                    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
                  ) : (
                    // Mic icon
                    <>
                      <path
                        d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
                        fill="currentColor"
                      />
                      <path
                        d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  )}
                </svg>
              </motion.button>

              <p className="text-sm text-foreground/40">
                {stage === 'recording' ? 'Listening... tap to stop' : 'Tap to start speaking'}
              </p>
            </div>

            {/* Live transcript */}
            {transcript && (
              <motion.div
                className="glass-card p-4 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-xs text-foreground/30 uppercase tracking-wider mb-2">Your words</p>
                <p className="text-lg text-foreground/80 font-jp">{transcript}</p>
              </motion.div>
            )}

            {/* Submit button */}
            {transcript && stage === 'ready' && (
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Button variant="primary" size="lg" onClick={submitShadowing}>
                  Grade my shadowing
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Grading stage */}
        {stage === 'grading' && (
          <motion.div
            key="grading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingHaiku />
          </motion.div>
        )}

        {/* Result stage */}
        {stage === 'result' && result && (
          <motion.div
            key="result"
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            {/* Overall stars */}
            <motion.div
              className="glass-card p-8 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex justify-center mb-4">
                {renderStars(result.overallStars)}
              </div>
              <p className="text-foreground/70 text-sm leading-relaxed">
                {result.feedback}
              </p>
            </motion.div>

            {/* Score breakdown */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Rhythm', score: result.rhythmScore },
                { label: 'Stress', score: result.stressScore },
                { label: 'Natural', score: result.naturalnessScore },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className="glass-card p-4 text-center"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <p className="text-xs text-foreground/30 uppercase tracking-wider mb-2">{item.label}</p>
                  <div className="flex justify-center">
                    {renderStars(item.score)}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Waveform comparison */}
            <motion.div
              className="glass-card p-5 space-y-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {renderWaveform(originalWave, '#1B4F8A', 'Original')}
              {renderWaveform(userWave, corridor === 'en-to-jp' ? '#FF6B35' : '#3B82F6', 'Yours')}
            </motion.div>

            {/* Tips */}
            {result.tips && result.tips.length > 0 && (
              <motion.div
                className="glass-card p-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-xs text-accent/60 uppercase tracking-wider mb-3">Tips to improve</p>
                <ul className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/60">
                      <span className="text-accent mt-0.5">*</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Encouragement */}
            {result.encouragement && (
              <motion.p
                className="text-center text-sm text-accent/70 italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {result.encouragement}
              </motion.p>
            )}

            {/* Action buttons */}
            <motion.div
              className="flex justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button variant="secondary" size="md" onClick={handleTryAgain}>
                Try Again
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => onComplete(result.overallStars)}
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4.167 10h11.666M10 4.167L15.833 10 10 15.833" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
