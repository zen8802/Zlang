'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Button from '@/components/ui/Button'

interface Props {
  targetCharacter: string
  targetReading: string
  targetRomaji: string
  targetEnglish: string
  memoryHook?: string
  onSuccess: () => void
  onSkip: () => void
  attemptNumber: number
}

type RecognitionState = 'idle' | 'checking' | 'correct' | 'wrong' | 'error'

function playAudio(char: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(char)
    u.lang = 'ja-JP'
    u.rate = 0.7
    speechSynthesis.speak(u)
  }
}

const CANVAS_SIZE = 300
// Cap DPR at 3 — beyond that there's no perceptual gain and OCR exports get huge
const DPR =
  typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1

export function CharacterWriteCanvas({
  targetCharacter, targetRomaji, targetEnglish,
  memoryHook, onSuccess, onSkip,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const hasDrawnRef = useRef(false)
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [state, setState] = useState<RecognitionState>('idle')
  const [recognizedChar, setRecognizedChar] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  // Canvas setup — runs ONCE on mount.
  // The canvas backing store is CANVAS_SIZE × DPR physical pixels, but the
  // CSS box stays at CANVAS_SIZE logical pixels. ctx.scale(DPR, DPR) makes
  // every drawing op operate in logical-pixel coordinates — so the pointer
  // handlers can use plain (clientX - rect.left) without any extra math.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = CANVAS_SIZE * DPR
    canvas.height = CANVAS_SIZE * DPR
    canvas.style.width = `${CANVAS_SIZE}px`
    canvas.style.height = `${CANVAS_SIZE}px`

    ctx.scale(DPR, DPR)
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1A1814'
    ctx.fillStyle = '#1A1814'
  }, [])

  // Logical-pixel coordinates from a pointer event. getBoundingClientRect()
  // already accounts for scroll, CSS transforms, and zoom. We do NOT multiply
  // by DPR — the context is already pre-scaled.
  const getPoint = useCallback(
    (e: React.PointerEvent): { x: number; y: number } => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      // rect.width/height equal the CSS size (CANVAS_SIZE) when no transform
      // is applied. The ratio handles odd cases like browser zoom.
      const x = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width)
      const y = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height)
      return { x, y }
    },
    [],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      if (state === 'checking' || state === 'correct') return
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current)
      if (state === 'wrong' || state === 'error') {
        clearCanvas()
        setState('idle')
      }

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Capture pointer so move/up still fire if cursor leaves canvas
      try {
        ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
      } catch {}

      const point = getPoint(e)
      isDrawingRef.current = true
      hasDrawnRef.current = true
      lastPointRef.current = point

      ctx.beginPath()
      ctx.moveTo(point.x, point.y)
      // Draw a dot for taps with no movement
      ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(point.x, point.y)
    },
    [state, getPoint],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      if (!isDrawingRef.current) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const point = getPoint(e)
      const prev = lastPointRef.current || point
      const mid = { x: (prev.x + point.x) / 2, y: (prev.y + point.y) / 2 }

      ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(mid.x, mid.y)

      lastPointRef.current = point
    },
    [getPoint],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      if (!isDrawingRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx && lastPointRef.current) {
        const point = getPoint(e)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
        ctx.beginPath()
      }

      isDrawingRef.current = false
      lastPointRef.current = null

      if (hasDrawnRef.current) {
        checkTimerRef.current = setTimeout(() => checkDrawing(), 1200)
      }
    },
    [getPoint],
  )

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Save the DPR scale, clear the physical pixels, restore the scale
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    hasDrawnRef.current = false
    lastPointRef.current = null
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current)
  }, [])

  const checkDrawing = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawnRef.current) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY
    if (!apiKey) {
      // No API key — just accept and move on
      setState('correct')
      playAudio(targetCharacter)
      setTimeout(onSuccess, 1000)
      return
    }

    setState('checking')

    try {
      // Export with white background
      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = canvas.width
      exportCanvas.height = canvas.height
      const exportCtx = exportCanvas.getContext('2d')!
      exportCtx.fillStyle = 'white'
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
      exportCtx.drawImage(canvas, 0, 0)
      const base64 = exportCanvas.toDataURL('image/png').split(',')[1]

      const res = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64 },
              features: [
                { type: 'TEXT_DETECTION', maxResults: 5 },
                { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 5 },
              ],
              imageContext: { languageHints: ['ja'] },
            }],
          }),
        }
      )

      const data = await res.json()
      const textAnnotations = data.responses?.[0]?.textAnnotations
      const fullText = data.responses?.[0]?.fullTextAnnotation?.text || ''
      const detected = (textAnnotations?.[0]?.description || fullText || '').trim().replace(/[\s\n]/g, '')

      setRecognizedChar(detected || null)
      setAttempts(a => a + 1)

      const isCorrect = detected.includes(targetCharacter) || detected === targetCharacter || detected[0] === targetCharacter

      if (isCorrect) {
        setState('correct')
        playAudio(targetCharacter)
        setTimeout(onSuccess, 1200)
      } else {
        setState('wrong')
      }
    } catch {
      setState('error')
    }
  }, [targetCharacter, onSuccess])

  const handleRetry = () => { clearCanvas(); setState('idle'); setRecognizedChar(null) }

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div className="text-center">
        <p className="text-sm font-semibold text-[#6B6560]">Write this character from memory</p>
        <div className="flex items-center justify-center gap-3 mt-2">
          <p className="text-5xl font-normal text-[#1B4F8A]" style={{ fontFamily: 'Noto Sans JP' }}>{targetCharacter}</p>
          <div className="text-left">
            <p className="font-semibold text-[#1A1814]">{targetEnglish}</p>
            <p className="text-xs font-mono text-[#9E9892]">{targetRomaji}</p>
          </div>
          <button onClick={() => playAudio(targetCharacter)} className="w-9 h-9 rounded-full bg-[#EBF0F8] flex items-center justify-center text-lg">🔊</button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex justify-center">
        <div className={`relative rounded-[4px] overflow-hidden transition-all duration-300 ${
          state === 'correct' ? 'shadow-[0_0_0_4px_rgba(61,107,79,0.15)]'
          : state === 'wrong' ? 'shadow-[0_0_0_4px_rgba(139,58,58,0.12)]'
          : ''
        }`} style={{
          width: CANVAS_SIZE, height: CANVAS_SIZE,
          border: state === 'correct' ? '1.5px solid #3D6B4F'
            : state === 'wrong' ? '1.5px solid #8B3A3A'
            : state === 'checking' ? '1.5px solid #1B4F8A'
            : '1.5px solid #C8C3BC',
        }}>
          <div className="absolute inset-0 bg-[#FDFBF8]" />

          {/* Grid lines */}
          <svg className="absolute inset-0 pointer-events-none" width={CANVAS_SIZE} height={CANVAS_SIZE}>
            <line x1={CANVAS_SIZE / 2} y1={6} x2={CANVAS_SIZE / 2} y2={CANVAS_SIZE - 6} stroke="#C8C3BC" strokeWidth={0.8} strokeDasharray="8,5" />
            <line x1={6} y1={CANVAS_SIZE / 2} x2={CANVAS_SIZE - 6} y2={CANVAS_SIZE / 2} stroke="#C8C3BC" strokeWidth={0.8} strokeDasharray="8,5" />
            <line x1={6} y1={6} x2={CANVAS_SIZE - 6} y2={CANVAS_SIZE - 6} stroke="#E0DAD2" strokeWidth={0.5} strokeDasharray="5,8" />
            <line x1={CANVAS_SIZE - 6} y1={6} x2={6} y2={CANVAS_SIZE - 6} stroke="#E0DAD2" strokeWidth={0.5} strokeDasharray="5,8" />
          </svg>

          {/* Drawing canvas — physical size set in the mount effect */}
          <canvas
            ref={canvasRef}
            style={{
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              touchAction: 'none',
              cursor: state === 'correct' ? 'default' : 'crosshair',
              opacity: state === 'correct' ? 0.4 : 1,
            }}
            className="absolute inset-0"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />

          {/* Checking overlay */}
          {state === 'checking' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FDFBF8]/60 backdrop-blur-[2px]">
              <div className="w-10 h-10 border-4 border-[#1B4F8A] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-[#1B4F8A] font-semibold">Reading...</p>
            </div>
          )}

          {/* Correct overlay */}
          {state === 'correct' && (
            <div className="absolute inset-0 flex items-center justify-center ink-in">
              <div className="w-16 h-16 rounded-full bg-[#EFF5F0] border border-[#B8D4C0] flex items-center justify-center">
                <span className="text-3xl text-[#3D6B4F] font-semibold">✓</span>
              </div>
            </div>
          )}

          {/* Wrong overlay */}
          {state === 'wrong' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FDFBF8]/80 backdrop-blur-[2px]">
              <p className="text-4xl font-semibold text-[#8B3A3A] mb-1">✗</p>
              {recognizedChar && recognizedChar !== targetCharacter && (
                <p className="text-xs text-[#6B6560]">
                  Looks like <span className="font-semibold" style={{ fontFamily: 'Noto Sans JP' }}>{recognizedChar}</span>
                </p>
              )}
            </div>
          )}

          {/* Error overlay */}
          {state === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#FDFBF8]/80">
              <p className="text-xs text-[#9E9892] text-center px-4">Couldn&apos;t read that — tap retry</p>
            </div>
          )}

          {/* Ghost hint — very faint target character */}
          {state === 'idle' && !hasDrawnRef.current && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[140px] font-normal select-none leading-none" style={{ fontFamily: 'Noto Sans JP', color: 'rgba(26,24,20,0.04)' }}>
                {targetCharacter}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Memory hook */}
      {memoryHook && (state === 'idle' || state === 'wrong') && (
        <div className="bg-[#F5F0E8] border border-[#D4C4A8] rounded-[6px] px-4 py-2.5 text-center">
          <p className="text-xs text-[#7A5C2E] italic">💡 {memoryHook}</p>
        </div>
      )}

      {/* Actions */}
      {state === 'wrong' && (
        <div className="space-y-2">
          <div className="bg-[#F5EEEE] border border-[#D4BABA] rounded-[6px] p-4 text-center">
            <p className="font-semibold text-[#8B3A3A]">
              {attempts >= 2 ? 'The answer is ' : 'Not quite — try again'}
              {attempts >= 2 && <span className="text-xl ml-1" style={{ fontFamily: 'Noto Sans JP' }}>{targetCharacter}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="wrong" size="md" onClick={handleRetry} className="flex-1">Clear & retry</Button>
            {attempts >= 2 && <Button variant="secondary" size="md" onClick={onSkip} className="flex-1">Skip →</Button>}
          </div>
        </div>
      )}

      {state === 'error' && <Button variant="secondary" size="md" fullWidth onClick={handleRetry}>Try again</Button>}

      {state === 'idle' && (
        <div className="flex gap-2">
          <Button variant="ghost" size="md" onClick={clearCanvas} className="flex-shrink-0 px-4 border border-[#E0DAD2] rounded-[6px] text-[#6B6560]">Clear</Button>
          <Button variant="primary" size="md" fullWidth onClick={checkDrawing} disabled={!hasDrawnRef.current}>Check ✓</Button>
        </div>
      )}
    </div>
  )
}

export default CharacterWriteCanvas
