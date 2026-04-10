'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { useAppStore } from '@/store/useAppStore'

// ---------------------------------------------------------------------------
// Types (copied from studio session)
// ---------------------------------------------------------------------------

interface ResponseOption {
  id: string
  japanese: string
  romaji: string
  english: string
  difficulty: 'safe' | 'natural' | 'bold' | 'funny'
}

interface VocabWord {
  word: string
  reading: string
  romaji: string
  meaning: string
  pos: string
}

interface Message {
  id: string
  role: 'character' | 'user'
  content: string
  romaji?: string
  english?: string
  vocab?: VocabWord[]
  coachNote?: string
  options?: ResponseOption[]
  jpOfYours?: { japanese: string; romaji: string; english: string }
  userEnglish?: string
  timestamp: number
}

interface TranslatedResponse {
  japanese: string
  reading: string
  romaji: string
  breakdown: {
    chunk: string
    reading: string
    meaning: string
    note?: string
  }[]
  naturalness: string
  alternativePhrase?: string
  alternativePhraseEN?: string
}

// ---------------------------------------------------------------------------
// Farewell detection
// ---------------------------------------------------------------------------

const FAREWELL_PATTERNS_JP = [
  'ありがとうございました',
  'ごちそうさま',
  'さようなら',
  'さよなら',
  'またね',
  'また来てください',
  'おやすみ',
  'バイバイ',
  'ばいばい',
  'お疲れ',
  '失礼します',
  'またのお越しを',
  '行ってらっしゃい',
  'いってらっしゃい',
  'お気をつけて',
]

const FAREWELL_PATTERNS_EN = [
  'goodbye',
  'see you',
  'thanks for coming',
  'take care',
]

export function containsFarewell(text: string): boolean {
  if (!text) return false
  // Strip furigana parentheses: 漢字(かんじ) -> 漢字
  const stripped = text.replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')
  for (const p of FAREWELL_PATTERNS_JP) {
    if (stripped.includes(p)) return true
  }
  const lower = stripped.toLowerCase()
  for (const p of FAREWELL_PATTERNS_EN) {
    if (lower.includes(p)) return true
  }
  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface AttemptPhaseProps {
  sessionId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
  diagnosing: boolean
  onEndAttempt: (messages: Message[]) => void
}

// ---------------------------------------------------------------------------
// POS colors for vocab highlights
// ---------------------------------------------------------------------------

const POS_COLORS: Record<string, { underline: string; bg: string; text: string; label: string }> = {
  noun:       { underline: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: '\u540D\u8A5E' },
  verb:       { underline: '#8B3A3A', bg: '#F5EEEE', text: '#8B3A3A', label: '\u52D5\u8A5E' },
  adjective:  { underline: '#6B5B8D', bg: '#F0EDF5', text: '#6B5B8D', label: '\u5F62\u5BB9\u8A5E' },
  adverb:     { underline: '#3D6B4F', bg: '#EFF5F0', text: '#3D6B4F', label: '\u526F\u8A5E' },
  particle:   { underline: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: '\u52A9\u8A5E' },
  phrase:     { underline: '#8B5A6B', bg: '#F5EEF0', text: '#8B5A6B', label: '\u8868\u73FE' },
  greeting:   { underline: '#3D6B5A', bg: '#EFF5F2', text: '#3D6B5A', label: '\u6328\u62F6' },
  counter:    { underline: '#6366F1', bg: '#EEF2FF', text: '#4F46E5', label: '\u52A9\u6570\u8A5E' },
  expression: { underline: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: '\u8868\u73FE' },
}

// ---------------------------------------------------------------------------
// Parse character response (copied from studio)
// ---------------------------------------------------------------------------

function parseCharacterResponse(text: string) {
  let remaining = text
  let characterContent = ''
  let romajiContent = ''
  let englishContent = ''
  let coachNote = ''
  let optionsRaw = ''

  const firstSep = remaining.search(/---\s*(?:VOCAB|ROMAJI|EN|COACH|OPTIONS|JP_OF_YOURS)\s*---/)
  if (firstSep >= 0) {
    characterContent = remaining.slice(0, firstSep).trim()
    remaining = remaining.slice(firstSep)
  } else {
    characterContent = remaining.trim()
    remaining = ''
  }

  const vocabList: VocabWord[] = []
  const vocabMatch = remaining.match(/---\s*VOCAB\s*---\s*([\s\S]*?)(?=---\s*(?:ROMAJI|EN|COACH|OPTIONS|JP_OF_YOURS)\s*---|$)/)
  if (vocabMatch) {
    const vocabLines = vocabMatch[1].trim().split('\n').filter(l => l.trim())
    for (const line of vocabLines) {
      const parts = line.split('|').map(p => p.trim())
      if (parts.length >= 5) {
        vocabList.push({
          word: parts[0],
          reading: parts[1],
          romaji: parts[2],
          meaning: parts[3],
          pos: parts[4].toLowerCase(),
        })
      }
    }
  }

  const romajiMatch = remaining.match(/---\s*ROMAJI\s*---\s*([\s\S]*?)(?=---\s*(?:EN|COACH|OPTIONS|JP_OF_YOURS)\s*---|$)/)
  if (romajiMatch) romajiContent = romajiMatch[1].trim()

  const enMatch = remaining.match(/---\s*EN\s*---\s*([\s\S]*?)(?=---\s*(?:COACH|OPTIONS|JP_OF_YOURS)\s*---|$)/)
  if (enMatch) englishContent = enMatch[1].trim()

  const coachMatch = remaining.match(/---\s*COACH\s*---\s*([\s\S]*?)(?=---\s*(?:OPTIONS|JP_OF_YOURS)\s*---|$)/)
  if (coachMatch) coachNote = coachMatch[1].trim()

  const optionsMatch = remaining.match(/---\s*OPTIONS\s*---\s*([\s\S]*?)(?=---\s*JP_OF_YOURS\s*---|$)/)
  if (optionsMatch) optionsRaw = optionsMatch[1].trim()

  let jpOfYours: { japanese: string; romaji: string; english: string } | undefined
  const jpMatch = remaining.match(/---\s*JP_OF_YOURS\s*---\s*([\s\S]*)$/)
  if (jpMatch) {
    const line = jpMatch[1].trim().split('\n').find(l => l.trim()) || ''
    const parts = line.split('|').map(p => p.trim())
    if (parts.length >= 3 && parts[0]) {
      jpOfYours = { japanese: parts[0], romaji: parts[1], english: parts[2] }
    }
  }

  const options: ResponseOption[] = []
  const lines = optionsRaw.split('\n').filter((l) => l.trim())
  for (const line of lines) {
    let match = line.match(/^\d+[\.\)]\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\w+)\s*$/)

    if (!match) {
      const parts = line.replace(/^\d+[\.\)]\s*/, '').split(/\s*\|\s*/)
      if (parts.length >= 4) {
        match = [line, parts[0], parts[1], parts[2], parts[3]] as unknown as RegExpMatchArray
      }
    }

    if (!match) {
      const parts = line.replace(/^\d+[\.\)]\s*/, '').split(/\t|  +/)
      if (parts.length >= 3) {
        match = [line, parts[0], parts[1] || '', parts[2] || '', parts[3] || 'natural'] as unknown as RegExpMatchArray
      }
    }

    if (match) {
      const diffRaw = (match[4] || 'natural').trim().toLowerCase()
      const difficulty = (['safe', 'natural', 'bold', 'funny'].includes(diffRaw) ? diffRaw : 'natural') as ResponseOption['difficulty']
      options.push({
        id: `opt-${Date.now()}-${options.length}`,
        japanese: match[1].trim(),
        romaji: match[2].trim(),
        english: match[3].trim(),
        difficulty,
      })
    }
  }

  return { characterContent, vocabList, romajiContent, englishContent, coachNote, options, jpOfYours }
}

// ---------------------------------------------------------------------------
// Furigana helpers (copied from studio)
// ---------------------------------------------------------------------------

function stripFurigana(text: string): string {
  return text.replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')
}

function renderWithFurigana(text: string, showFurigana: boolean) {
  if (!showFurigana) {
    return <>{stripFurigana(text)}</>
  }

  const parts: React.ReactNode[] = []
  const regex = /([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <ruby key={match.index}>
        {match[1]}
        <rp>(</rp>
        <rt className="text-[10px]" style={{ color: '#9E9892' }}>{match[2]}</rt>
        <rp>)</rp>
      </ruby>,
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <>{parts}</>
}

// ---------------------------------------------------------------------------
// Helper: find original chunk with furigana
// ---------------------------------------------------------------------------

function findOriginalChunk(originalText: string, plainChunk: string): string {
  const regex = new RegExp(
    plainChunk.split('').map(c => {
      if (/[一-龥々]/.test(c)) {
        return c + '(?:\\([ぁ-んァ-ヶー]+\\))?'
      }
      return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }).join(''),
  )
  const match = originalText.match(regex)
  if (match) return match[0]
  return plainChunk
}

// ---------------------------------------------------------------------------
// DialogueText with clickable vocab highlights
// ---------------------------------------------------------------------------

function DialogueText({
  text,
  vocab,
  showFurigana,
  onWordClick,
}: {
  text: string
  vocab?: VocabWord[]
  showFurigana: boolean
  onWordClick: (word: VocabWord, rect: DOMRect) => void
}) {
  if (!vocab || vocab.length === 0) {
    return (
      <span style={{ fontFamily: 'Noto Sans JP' }}>
        {renderWithFurigana(text, showFurigana)}
      </span>
    )
  }

  const plainText = stripFurigana(text)

  type Segment = { text: string; isVocab: false } | { text: string; isVocab: true; vocabData: VocabWord }
  const segments: Segment[] = []

  const vocabWithPos = vocab
    .map(v => {
      const plain = stripFurigana(v.word)
      const idx = plainText.indexOf(plain)
      return { ...v, plain, idx }
    })
    .filter(v => v.idx >= 0)
    .sort((a, b) => a.idx - b.idx || b.plain.length - a.plain.length)

  let cursor = 0
  for (const v of vocabWithPos) {
    if (v.idx < cursor) continue
    if (v.idx > cursor) {
      segments.push({ text: plainText.slice(cursor, v.idx), isVocab: false })
    }
    segments.push({ text: v.plain, isVocab: true, vocabData: v })
    cursor = v.idx + v.plain.length
  }
  if (cursor < plainText.length) {
    segments.push({ text: plainText.slice(cursor), isVocab: false })
  }

  return (
    <span style={{ fontFamily: 'Noto Sans JP' }}>
      {segments.map((seg, i) => {
        if (!seg.isVocab) {
          return (
            <span key={i}>
              {showFurigana ? renderWithFurigana(findOriginalChunk(text, seg.text), showFurigana) : seg.text}
            </span>
          )
        }

        const posStyle = POS_COLORS[seg.vocabData.pos] || POS_COLORS.noun
        const originalWord = seg.vocabData.word

        return (
          <span
            key={i}
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              onWordClick(seg.vocabData, rect)
            }}
            className="cursor-pointer rounded-sm px-[1px] hover:opacity-80"
            style={{
              borderBottom: `2px solid ${posStyle.underline}`,
              paddingBottom: '1px',
            }}
          >
            {showFurigana ? renderWithFurigana(originalWord, true) : seg.text}
          </span>
        )
      })}
    </span>
  )
}

// ---------------------------------------------------------------------------
// VocabPopup
// ---------------------------------------------------------------------------

function VocabPopup({ word, rect, onClose }: { word: VocabWord; rect: DOMRect; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const posStyle = POS_COLORS[word.pos] || POS_COLORS.noun

  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800
  const below = rect.bottom + 8
  const above = rect.top - 200
  const top = below + 200 > viewportH ? Math.max(8, above) : below
  const left = Math.max(8, Math.min(rect.left, (typeof window !== 'undefined' ? window.innerWidth : 400) - 268))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 w-64 bg-[#FDFBF8] rounded-[8px] overflow-hidden border border-[#E0DAD2]"
      style={{
        top,
        left,
        boxShadow: '0 4px 20px rgba(26,24,20,0.10)',
      }}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: posStyle.underline }} />
      <div className="p-3.5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-2xl font-semibold" style={{ fontFamily: 'Noto Sans JP', color: '#1A1814' }}>
              {stripFurigana(word.word)}
            </p>
            <p className="text-xs mt-0.5" style={{ fontFamily: 'Noto Sans JP', color: '#1B4F8A' }}>
              {word.reading}
            </p>
            <p className="text-[10px]" style={{ fontFamily: 'DM Mono, monospace', color: '#B0B0B0' }}>
              {word.romaji}
            </p>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: posStyle.bg, color: posStyle.text }}
          >
            {posStyle.label} · {word.pos}
          </span>
        </div>
        <p className="text-sm font-semibold" style={{ color: '#1A1814' }}>
          {word.meaning}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AttemptPhase component
// ---------------------------------------------------------------------------

export default function AttemptPhase({ sessionId, session, diagnosing, onEndAttempt }: AttemptPhaseProps) {
  const globalShowFurigana = useAppStore((s) => s.showFurigana)
  const globalShowTranslation = useAppStore((s) => s.showTranslation)
  const userProfile = useAppStore((s) => s.userProfile)

  const [showFurigana, setShowFurigana] = useState(true)
  const [showRomaji, setShowRomaji] = useState(true)
  const [showTranslation, setShowTranslation] = useState(true)
  const [showCoachNotes, setShowCoachNotes] = useState(true)

  useEffect(() => {
    setShowFurigana(globalShowFurigana)
    setShowTranslation(globalShowTranslation)
  }, [globalShowFurigana, globalShowTranslation])

  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animatedChars, setAnimatedChars] = useState(0)
  const [pendingMessage, setPendingMessage] = useState<Message | null>(null)
  const [autoEnding, setAutoEnding] = useState(false)
  const animateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeVocab, setActiveVocab] = useState<VocabWord | null>(null)
  const [vocabPopupRect, setVocabPopupRect] = useState<DOMRect | null>(null)

  // English-input → AI-translate flow (beginner mode)
  const [englishInput, setEnglishInput] = useState('')
  const [translating, setTranslating] = useState(false)
  const [translated, setTranslated] = useState<TranslatedResponse | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const userExchanges = messages.filter(m => m.role === 'user').length

  // Load existing messages
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = session?.attemptMessages ?? session?.messages ?? []
    if (raw.length > 0) {
      const parsedMessages: Message[] = raw.map((msg, idx) => {
        const role: 'character' | 'user' =
          msg.role === 'user' ? 'user' : 'character'
        if (role === 'character') {
          const parsed = parseCharacterResponse(msg.content || '')
          return {
            id: msg.id || `loaded-char-${idx}`,
            role: 'character',
            content: parsed.characterContent,
            romaji: parsed.romajiContent || undefined,
            english: parsed.englishContent || undefined,
            vocab: parsed.vocabList.length > 0 ? parsed.vocabList : undefined,
            coachNote: parsed.coachNote || undefined,
            options: parsed.options.length > 0 ? parsed.options : undefined,
            timestamp: msg.timestamp || Date.now(),
          }
        }
        return {
          id: msg.id || `loaded-user-${idx}`,
          role: 'user',
          content: msg.content || '',
          timestamp: msg.timestamp || Date.now(),
        }
      })
      setMessages(parsedMessages)
    }
  }, [session?.attemptMessages, session?.messages])

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isStreaming, scrollToBottom])

  // Send message
  const sendText = useCallback(
    async (text: string, userEnglish?: string) => {
      if (!text.trim() || isStreaming) return

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        userEnglish: userEnglish?.trim() || undefined,
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, userMsg])
      setIsStreaming(true)

      try {
        const res = await fetch(`/api/loop/sessions/${sessionId}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text.trim(), phase: 'attempt', userProfile }),
        })

        if (!res.ok) throw new Error('Failed to send message')
        if (!res.body) throw new Error('No response body')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
        }

        const parsed = parseCharacterResponse(accumulated)

        const characterMsg: Message = {
          id: `char-${Date.now()}`,
          role: 'character',
          content: parsed.characterContent,
          romaji: parsed.romajiContent || undefined,
          english: parsed.englishContent || undefined,
          vocab: parsed.vocabList.length > 0 ? parsed.vocabList : undefined,
          coachNote: parsed.coachNote || undefined,
          options: parsed.options.length > 0 ? parsed.options : undefined,
          timestamp: Date.now(),
        }

        // Attach jpOfYours to the most recent user message (if present)
        if (parsed.jpOfYours) {
          setMessages(prev => {
            const next = [...prev]
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].role === 'user') {
                next[i] = { ...next[i], jpOfYours: parsed.jpOfYours }
                break
              }
            }
            return next
          })
        }

        setIsStreaming(false)
        setPendingMessage(characterMsg)
        setIsAnimating(true)
        setAnimatedChars(0)

        const fullText = stripFurigana(parsed.characterContent)
        const totalChars = fullText.length
        const msPerChar = Math.max(30, Math.min(80, 2000 / totalChars))
        let charCount = 0

        animateTimerRef.current = setInterval(() => {
          charCount++
          setAnimatedChars(charCount)
          if (charCount >= totalChars) {
            if (animateTimerRef.current) clearInterval(animateTimerRef.current)
            animateTimerRef.current = null
            setMessages(prev => {
              const next = [...prev, characterMsg]
              // Auto-end check: farewell detected + at least 2 user exchanges
              const userCount = next.filter(m => m.role === 'user').length
              if (containsFarewell(parsed.characterContent) && userCount >= 2) {
                setAutoEnding(true)
                autoEndTimerRef.current = setTimeout(() => {
                  onEndAttempt(next)
                }, 1500)
              }
              return next
            })
            setPendingMessage(null)
            setIsAnimating(false)
            setAnimatedChars(0)
          }
        }, msPerChar)
      } catch (err) {
        console.error('Send error:', err)
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming, sessionId, onEndAttempt, userProfile],
  )

  // Translate English → Japanese via API
  const handleTranslate = useCallback(async () => {
    if (!englishInput.trim() || translating) return
    setTranslating(true)
    setShowBreakdown(true)

    // Build context from existing message history
    const lastCharacter = [...messages].reverse().find(m => m.role === 'character')
    const characterLine = lastCharacter ? stripFurigana(lastCharacter.content) : ''
    const characterLineEN = lastCharacter?.english || ''

    // Build previousExchanges pairs (character → user)
    const previousExchanges: { characterLine: string; characterLineEN: string; userJP: string; userEN: string }[] = []
    for (let i = 0; i < messages.length - (lastCharacter ? 1 : 0); i++) {
      const m = messages[i]
      if (m.role === 'character') {
        const next = messages[i + 1]
        if (next && next.role === 'user') {
          previousExchanges.push({
            characterLine: stripFurigana(m.content),
            characterLineEN: m.english || '',
            userJP: stripFurigana(next.content),
            userEN: next.userEnglish || '',
          })
        }
      }
    }

    try {
      const res = await fetch('/api/lessons/translate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEnglish: englishInput,
          characterLine,
          characterLineEN,
          setting: session?.setting || session?.scenarioTitle || '',
          characterName: session?.characterName || '',
          previousExchanges,
          userProfile,
        }),
      })
      const data = await res.json()
      if (data.translation) {
        setTranslated(data.translation)
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          setTimeout(() => {
            speechSynthesis.cancel()
            const u = new SpeechSynthesisUtterance(data.translation.japanese)
            u.lang = 'ja-JP'
            u.rate = 0.85
            speechSynthesis.speak(u)
          }, 400)
        }
      }
    } catch (err) {
      console.error('translate error:', err)
    }
    setTranslating(false)
  }, [englishInput, translating, messages, session, userProfile])

  const playJapaneseAudio = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'ja-JP'
      u.rate = 0.85
      speechSynthesis.speak(u)
    }
  }, [])

  const handleSendTranslated = useCallback(() => {
    if (!translated) return
    const japanese = translated.japanese
    const english = englishInput
    setTranslated(null)
    setEnglishInput('')
    setShowBreakdown(true)
    sendText(japanese, english)
  }, [translated, englishInput, sendText])

  const handleEditTranslation = useCallback(() => {
    setTranslated(null)
  }, [])

  // Cleanup any pending auto-end timer on unmount
  useEffect(() => {
    return () => {
      if (autoEndTimerRef.current) clearTimeout(autoEndTimerRef.current)
      if (animateTimerRef.current) clearInterval(animateTimerRef.current)
    }
  }, [])

  // ---- Diagnosing overlay ----
  if (diagnosing) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#1B4F8A]/20 border-t-[#1B4F8A] animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-[#7A5C2E]/20 border-b-[#7A5C2E] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
          </div>
          <p className="text-lg font-semibold mb-1" style={{ color: '#1A1814' }}>
            Analyzing your conversation...
          </p>
          <p className="text-sm" style={{ color: '#6B6560' }}>
            Finding exactly what you need to learn
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toggle pills */}
      <div className="shrink-0 px-4 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#FDFBF8]/40 border-b border-[#E0DAD2]/50">
        {[
          { key: 'furigana', label: 'ふりがな', active: showFurigana, toggle: () => setShowFurigana(p => !p) },
          { key: 'romaji', label: 'romaji', active: showRomaji, toggle: () => setShowRomaji(p => !p) },
          { key: 'english', label: 'EN', active: showTranslation, toggle: () => setShowTranslation(p => !p) },
          { key: 'coach', label: '↳', active: showCoachNotes, toggle: () => setShowCoachNotes(p => !p) },
        ].map(t => (
          <button
            key={t.key}
            onClick={t.toggle}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
              t.active
                ? 'bg-[#EBF0F8] border-[#1B4F8A] text-[#1B4F8A]'
                : 'bg-transparent border-[#E0DAD2] text-[#9E9892]'
            }`}
            style={{ fontFamily: t.key === 'furigana' ? 'Noto Sans JP' : undefined }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Opening context */}
        {session && messages.length === 0 && !isStreaming && (
          <div className="text-center py-6">
            <span className="text-5xl block mb-3">{session.scenarioEmoji}</span>
            <p className="text-base font-semibold" style={{ color: '#1A1814' }}>
              {session.scenarioTitle}
            </p>
            <p className="text-sm mt-0.5" style={{ fontFamily: 'Noto Sans JP', color: '#9E9892' }}>
              {session.scenarioTitleJP}
            </p>
            <p className="text-sm mt-3 max-w-xs mx-auto" style={{ color: '#6B6560' }}>
              Pick a response below to start. Don&apos;t worry about mistakes!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'character' ? (
              <div className="flex items-end gap-2 max-w-[85%]">
                <div className="w-9 h-9 rounded-full shrink-0 mb-1 overflow-hidden border-2 border-white shadow-sm">
                  {session?.characterAvatar ? (
                    <Image src={session.characterAvatar} alt="" width={36} height={36} className="w-full h-full object-cover" quality={90} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: session?.characterColor || '#1B4F8A' }}>{session?.characterName?.[0] || '?'}</div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="bg-[#FDFBF8] px-4 py-3 border border-[#E0DAD2]" style={{ borderRadius: '2px 12px 12px 12px' }}>
                    <p className="text-[15px] leading-[2] whitespace-pre-wrap">
                      <DialogueText
                        text={msg.content}
                        vocab={msg.vocab}
                        showFurigana={showFurigana}
                        onWordClick={(word, rect) => {
                          setActiveVocab(activeVocab?.word === word.word ? null : word)
                          setVocabPopupRect(rect)
                        }}
                      />
                    </p>
                    {showRomaji && msg.romaji && (
                      <p className="text-[11px] mt-1 leading-relaxed" style={{ fontFamily: 'DM Mono, monospace', color: '#B0B0B0' }}>
                        {msg.romaji}
                      </p>
                    )}
                    {showTranslation && msg.english && (
                      <p className="text-xs mt-1 italic leading-relaxed" style={{ color: '#9E9892' }}>
                        {msg.english}
                      </p>
                    )}
                  </div>

                  {showCoachNotes && msg.coachNote && (
                    <div className="px-3.5 py-2 rounded-[6px] bg-transparent border-l-[2px] border-[#1B4F8A]/30">
                      <p className="text-[13px] leading-relaxed italic" style={{ color: '#6B6560' }}>
                        ↳ {renderWithFurigana(msg.coachNote, showFurigana)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <div
                    className="max-w-[85%] px-4 py-3 text-white"
                    style={{ backgroundColor: '#1B4F8A', borderRadius: '12px 2px 12px 12px' }}
                  >
                    <p
                      className="text-[15px] leading-relaxed whitespace-pre-wrap"
                      style={{ fontFamily: 'Noto Sans JP' }}
                    >
                      {renderWithFurigana(msg.content, showFurigana)}
                    </p>
                  </div>
                </div>
                {msg.jpOfYours && (
                  <div className="flex justify-end mt-1">
                    <div className="max-w-[85%] px-3 py-1.5 rounded-[6px] bg-[#EBF0F8] border border-[#1B4F8A]/15">
                      <p className="text-[11px] text-[#1B4F8A]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        In Japanese:{' '}
                        <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                          {msg.jpOfYours.japanese}
                        </span>
                        <span className="text-[#1B4F8A]/60 ml-1">({msg.jpOfYours.romaji})</span>
                      </p>
                    </div>
                  </div>
                )}
                {msg.userEnglish && (
                  <div className="flex justify-end mt-1">
                    <p
                      className="text-[11px] italic text-[#9E9892] max-w-[85%] pr-1"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      &ldquo;{msg.userEnglish}&rdquo;
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* Streaming dots */}
        {isStreaming && (
          <div className="flex items-end gap-2 max-w-[85%]">
            <div className="w-9 h-9 rounded-full shrink-0 mb-1 overflow-hidden border-2 border-white shadow-sm">
              {session?.characterAvatar ? (
                <Image src={session.characterAvatar} alt="" width={36} height={36} className="w-full h-full object-cover" quality={90} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: session?.characterColor || '#1B4F8A' }}>{session?.characterName?.[0] || '?'}</div>
              )}
            </div>
            <div className="bg-[#FDFBF8] px-5 py-3.5 border border-[#E0DAD2]" style={{ borderRadius: '2px 12px 12px 12px' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E0DAD2] animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#E0DAD2] animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#E0DAD2] animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Typewriter animation */}
        {isAnimating && pendingMessage && (() => {
          const fullClean = stripFurigana(pendingMessage.content)
          const visibleText = fullClean.slice(0, animatedChars)
          const romajiClean = pendingMessage.romaji || ''
          const romajiRatio = romajiClean.length > 0 ? animatedChars / fullClean.length : 0
          const visibleRomaji = romajiClean.slice(0, Math.round(romajiRatio * romajiClean.length))
          const enClean = pendingMessage.english || ''
          const visibleEn = enClean.slice(0, Math.round(romajiRatio * enClean.length))
          const isDone = animatedChars >= fullClean.length

          return (
            <div className="flex items-end gap-2 max-w-[85%]">
              <div className="w-9 h-9 rounded-full shrink-0 mb-1 overflow-hidden border-2 border-white shadow-sm">
                {session?.characterAvatar ? (
                  <Image src={session.characterAvatar} alt="" width={36} height={36} className="w-full h-full object-cover" quality={90} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: session?.characterColor || '#1B4F8A' }}>{session?.characterName?.[0] || '?'}</div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="bg-[#FDFBF8] px-4 py-3 border border-[#E0DAD2]" style={{ borderRadius: '2px 12px 12px 12px' }}>
                  <p className="text-[15px] leading-[2] whitespace-pre-wrap" style={{ fontFamily: 'Noto Sans JP', color: '#1A1814' }}>
                    {visibleText}
                    {!isDone && <span className="inline-block w-1.5 h-4 bg-[#1B4F8A] rounded-sm animate-pulse ml-0.5 align-middle" />}
                  </p>
                  {showRomaji && visibleRomaji && (
                    <p className="text-[11px] mt-1 leading-relaxed" style={{ fontFamily: 'DM Mono, monospace', color: '#B0B0B0' }}>
                      {visibleRomaji}
                    </p>
                  )}
                  {showTranslation && visibleEn && (
                    <p className="text-xs mt-1 italic leading-relaxed" style={{ color: '#9E9892' }}>
                      {visibleEn}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {/* English-input → AI-translate flow (beginner) */}
        {!isStreaming && !isAnimating && !diagnosing && messages.length > 0 && messages[messages.length - 1]?.role === 'character' && (
          <div className="pt-2 space-y-3">
            {/* Translation result */}
            {translated && (
              <div className="space-y-3 ink-in">
                <div className="flex justify-end">
                  <div
                    className="bg-[#1B4F8A] px-4 py-3 max-w-[85%]"
                    style={{ borderRadius: '10px 2px 10px 10px' }}
                  >
                    <p
                      className="text-white text-[15px] leading-relaxed"
                      style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                    >
                      {translated.japanese}
                    </p>
                    <p
                      className="text-white/50 text-xs mt-1 font-medium"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {translated.romaji}
                    </p>
                    <button
                      onClick={() => playJapaneseAudio(translated.japanese)}
                      className="text-white/40 text-xs mt-1 hover:text-white/70 transition-colors flex items-center gap-1"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      🔊 Hear it
                    </button>
                  </div>
                </div>

                <div className="bg-[#FDFBF8] rounded-[10px] border border-[#E0DAD2] overflow-hidden">
                  <button
                    onClick={() => setShowBreakdown(b => !b)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F5F0EB] transition-colors"
                  >
                    <p
                      className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      Breaking it down
                    </p>
                    <span className="text-[#C8C3BC] text-xs">
                      {showBreakdown ? '▲' : '▼'}
                    </span>
                  </button>

                  {showBreakdown && (
                    <div className="px-4 pb-4 space-y-3 border-t border-[#E0DAD2] pt-3">
                      <div className="space-y-2">
                        {translated.breakdown.map((chunk, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 pb-2 border-b border-[#F5F0EB] last:border-0 last:pb-0"
                          >
                            <div className="shrink-0 min-w-[80px]">
                              <p
                                className="text-base text-[#1A1814] font-medium"
                                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                              >
                                {chunk.chunk}
                              </p>
                              <p
                                className="text-[11px] text-[#9E9892]"
                                style={{ fontFamily: 'DM Mono, monospace' }}
                              >
                                {chunk.reading}
                              </p>
                            </div>
                            <div className="flex-1">
                              <p
                                className="text-sm text-[#1A1814]"
                                style={{ fontFamily: 'DM Sans, sans-serif' }}
                              >
                                {chunk.meaning}
                              </p>
                              {chunk.note && (
                                <p
                                  className="text-xs text-[#7A5C2E] mt-0.5 italic"
                                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                                >
                                  {chunk.note}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-[#EBF0F8] rounded-[8px] px-3 py-2 border border-[#1B4F8A]/15">
                        <p
                          className="text-xs text-[#1B4F8A]"
                          style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                          {translated.naturalness}
                        </p>
                      </div>

                      {translated.alternativePhrase && (
                        <div className="bg-[#F5F0E8] rounded-[8px] px-3 py-2 border border-[#D4C4A8]">
                          <p
                            className="text-[10px] text-[#7A5C2E] font-medium tracking-wide uppercase mb-1"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                          >
                            You could also say
                          </p>
                          <p
                            className="text-sm text-[#1A1814]"
                            style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                          >
                            {translated.alternativePhrase}
                          </p>
                          {translated.alternativePhraseEN && (
                            <p
                              className="text-xs text-[#9E9892] italic mt-0.5"
                              style={{ fontFamily: 'DM Sans, sans-serif' }}
                            >
                              {translated.alternativePhraseEN}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSendTranslated}
                  className="w-full bg-[#1B4F8A] hover:bg-[#4A7AB5] text-white font-semibold py-3 rounded-[10px] transition-colors"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  Send →
                </button>
                <div className="text-center">
                  <button
                    onClick={handleEditTranslation}
                    className="text-xs font-medium underline transition-colors hover:text-[#1B4F8A]"
                    style={{ color: '#9E9892', fontFamily: 'DM Sans, sans-serif' }}
                  >
                    Edit / try different wording
                  </button>
                </div>
              </div>
            )}

            {/* English input — only when not yet translated */}
            {!translated && (
              <div className="space-y-2">
                <p
                  className="text-xs text-[#9E9892] text-center"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  Say what you want in English — we&apos;ll translate it
                </p>
                <div className="bg-[#FDFBF8] rounded-[10px] border-2 border-[#E0DAD2] focus-within:border-[#1B4F8A] transition-colors overflow-hidden">
                  <textarea
                    value={englishInput}
                    onChange={e => setEnglishInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleTranslate()
                      }
                    }}
                    placeholder="Type what you want to say in English..."
                    rows={2}
                    className="w-full px-4 pt-3 pb-1 text-sm text-[#1A1814] resize-none bg-transparent outline-none placeholder-[#C8C3BC]"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  />
                  <div className="flex items-center justify-between px-4 pb-3">
                    <p
                      className="text-[10px] text-[#C8C3BC]"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      Write in English — we&apos;ll translate it
                    </p>
                    <button
                      onClick={handleTranslate}
                      disabled={!englishInput.trim() || translating}
                      className={`text-xs font-medium px-3 py-1.5 rounded-[6px] transition-all ${
                        englishInput.trim() && !translating
                          ? 'bg-[#1B4F8A] text-white hover:bg-[#4A7AB5]'
                          : 'bg-[#E0DAD2] text-[#C8C3BC] cursor-not-allowed'
                      }`}
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {translating ? 'Translating...' : 'Translate →'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auto-end "wrapping up" indicator */}
        {autoEnding && !diagnosing && (
          <div className="pt-4 pb-2 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF0F8] border border-[#1B4F8A]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] animate-pulse" />
              <span className="text-[11px] font-semibold" style={{ color: '#1B4F8A' }}>
                Wrapping up...
              </span>
            </div>
          </div>
        )}

        {/* End attempt button (after 2+ exchanges — tight loops finish fast) */}
        {!autoEnding && userExchanges >= 2 && !isStreaming && !isAnimating && !diagnosing && (
          <div className="pt-4 pb-2 text-center">
            <Button variant="gold" size="md" onClick={() => onEndAttempt(messages)}>
              End →
            </Button>
            <p className="text-[10px] mt-1.5" style={{ color: '#9E9892' }}>
              AI will analyze your conversation
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Vocab popup */}
      {activeVocab && vocabPopupRect && (
        <VocabPopup
          word={activeVocab}
          rect={vocabPopupRect}
          onClose={() => { setActiveVocab(null); setVocabPopupRect(null) }}
        />
      )}
    </div>
  )
}
