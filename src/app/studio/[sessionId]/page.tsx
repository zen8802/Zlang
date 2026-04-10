'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useAppStore } from '@/store/useAppStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResponseOption {
  id: string
  japanese: string
  romaji: string
  english: string
  difficulty: 'safe' | 'natural' | 'bold' | 'funny'
}

interface VocabWord {
  word: string       // with furigana format
  reading: string
  romaji: string
  meaning: string
  pos: string        // noun, verb, adjective, etc.
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

const POS_COLORS: Record<string, { underline: string; bg: string; text: string; label: string }> = {
  noun:       { underline: '#1B4F8A', bg: '#EBF0F8', text: '#1B4F8A', label: '名詞' },
  verb:       { underline: '#8B3A3A', bg: '#F5EEEE', text: '#8B3A3A', label: '動詞' },
  adjective:  { underline: '#6B5B8D', bg: '#F0EDF5', text: '#6B5B8D', label: '形容詞' },
  adverb:     { underline: '#3D6B4F', bg: '#EFF5F0', text: '#3D6B4F', label: '副詞' },
  particle:   { underline: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: '助詞' },
  phrase:     { underline: '#8B5A6B', bg: '#F5EEF0', text: '#8B5A6B', label: '表現' },
  greeting:   { underline: '#3D6B5A', bg: '#EFF5F2', text: '#3D6B5A', label: '挨拶' },
  counter:    { underline: '#4F5B8D', bg: '#EEF0F5', text: '#4F5B8D', label: '助数詞' },
  expression: { underline: '#7A5C2E', bg: '#F5F0E8', text: '#7A5C2E', label: '表現' },
}

interface SessionData {
  id: string
  scenarioId: string
  scenarioTitle: string
  scenarioTitleJP: string
  scenarioEmoji: string
  characterName: string
  characterNameJP: string
  characterColor: string
  characterAvatar: string
  voiceId: string
  characterDescription: string
  messages: Message[]
}

interface LessonBlock {
  type: 'vocab' | 'grammar' | 'cultural'
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
}

// ---------------------------------------------------------------------------
// Difficulty styling
// ---------------------------------------------------------------------------

const DIFFICULTY_STYLES: Record<
  ResponseOption['difficulty'],
  { color: 'green' | 'blue' | 'gold' | 'purple'; emoji: string; bg: string; border: string }
> = {
  safe: { color: 'green', emoji: '🟢', bg: '#EFF5F0', border: '#3D6B4F' },
  natural: { color: 'blue', emoji: '🔵', bg: '#EBF0F8', border: '#1B4F8A' },
  bold: { color: 'gold', emoji: '🟡', bg: '#F5F0E8', border: '#7A5C2E' },
  funny: { color: 'purple', emoji: '😂', bg: '#F3E8FF', border: '#8B5CF6' },
}

// ---------------------------------------------------------------------------
// Parse character response: dialogue + coach + options
// ---------------------------------------------------------------------------

function parseCharacterResponse(text: string) {
  // Split on all separators: ---ROMAJI---, ---EN---, ---COACH---, ---OPTIONS---
  let remaining = text
  let characterContent = ''
  let romajiContent = ''
  let englishContent = ''
  let coachNote = ''
  let optionsRaw = ''

  // Extract character dialogue (everything before first separator)
  // Flexible separator matching: allow spaces around hyphens and words
  const firstSep = remaining.search(/---\s*(?:VOCAB|ROMAJI|EN|COACH|OPTIONS)\s*---/)
  if (firstSep >= 0) {
    characterContent = remaining.slice(0, firstSep).trim()
    remaining = remaining.slice(firstSep)
  } else {
    characterContent = remaining.trim()
    remaining = ''
  }

  // Extract vocab annotations
  const vocabList: VocabWord[] = []
  const vocabMatch = remaining.match(/---\s*VOCAB\s*---\s*([\s\S]*?)(?=---\s*(?:ROMAJI|EN|COACH|OPTIONS)\s*---|$)/)
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

  // Extract romaji
  const romajiMatch = remaining.match(/---\s*ROMAJI\s*---\s*([\s\S]*?)(?=---\s*(?:EN|COACH|OPTIONS)\s*---|$)/)
  if (romajiMatch) romajiContent = romajiMatch[1].trim()

  // Extract English translation
  const enMatch = remaining.match(/---\s*EN\s*---\s*([\s\S]*?)(?=---\s*(?:COACH|OPTIONS)\s*---|$)/)
  if (enMatch) englishContent = enMatch[1].trim()

  // Extract coach note
  const coachMatch = remaining.match(/---\s*COACH\s*---\s*([\s\S]*?)(?=---\s*OPTIONS\s*---|$)/)
  if (coachMatch) coachNote = coachMatch[1].trim()

  // Extract options — try multiple separator formats
  const optionsMatch = remaining.match(/---\s*OPTIONS\s*---\s*([\s\S]*)$/)
  if (optionsMatch) optionsRaw = optionsMatch[1].trim()

  const options: ResponseOption[] = []
  const lines = optionsRaw.split('\n').filter((l) => l.trim())
  for (const line of lines) {
    // Try pipe-separated: 1. Japanese | romaji | English | difficulty
    let match = line.match(/^\d+[\.\)]\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\w+)\s*$/)

    // Fallback: if pipe format fails, try to split on " | " (with spaces)
    if (!match) {
      const parts = line.replace(/^\d+[\.\)]\s*/, '').split(/\s*\|\s*/)
      if (parts.length >= 4) {
        match = [line, parts[0], parts[1], parts[2], parts[3]] as unknown as RegExpMatchArray
      }
    }

    // Fallback: try tab or double-space separated
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

  // Debug: if we got content but no options, log it
  if (options.length === 0 && optionsRaw.length > 0) {
    console.warn('[Studio] Failed to parse options from:', optionsRaw.slice(0, 200))
  }

  return { characterContent, vocabList, romajiContent, englishContent, coachNote, options }
}

// ---------------------------------------------------------------------------
// Strip furigana from text: 漢字(かんじ) → 漢字
// ---------------------------------------------------------------------------

function stripFurigana(text: string): string {
  return text.replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')
}

// ---------------------------------------------------------------------------
// Render Japanese text with furigana + vocab highlights
// ---------------------------------------------------------------------------

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
// Render dialogue with clickable vocab-highlighted words
// ---------------------------------------------------------------------------

function DialogueText({
  text,
  vocab,
  showFurigana,
  highlightCharIndex = -1,
  onWordClick,
}: {
  text: string
  vocab?: VocabWord[]
  showFurigana: boolean
  highlightCharIndex?: number
  onWordClick: (word: VocabWord, rect: DOMRect) => void
}) {
  if (!vocab || vocab.length === 0) {
    return (
      <span style={{ fontFamily: 'Noto Sans JP' }}>
        {renderWithFurigana(text, showFurigana)}
      </span>
    )
  }

  // Build a plain text version (no furigana parens) for matching
  const plainText = stripFurigana(text)

  // Find positions of each vocab word in the plain text
  type Segment = { text: string; isVocab: false } | { text: string; isVocab: true; vocabData: VocabWord }
  const segments: Segment[] = []

  // Sort vocab by position in text (first occurrence), longest first for overlaps
  const vocabWithPos = vocab
    .map(v => {
      const plain = stripFurigana(v.word)
      const idx = plainText.indexOf(plain)
      return { ...v, plain, idx }
    })
    .filter(v => v.idx >= 0)
    .sort((a, b) => a.idx - b.idx || b.plain.length - a.plain.length)

  // Walk through plainText and split into segments
  let cursor = 0
  for (const v of vocabWithPos) {
    if (v.idx < cursor) continue // skip overlapping
    if (v.idx > cursor) {
      segments.push({ text: plainText.slice(cursor, v.idx), isVocab: false })
    }
    segments.push({ text: v.plain, isVocab: true, vocabData: v })
    cursor = v.idx + v.plain.length
  }
  if (cursor < plainText.length) {
    segments.push({ text: plainText.slice(cursor), isVocab: false })
  }

  // Track character position for TTS highlighting
  // We highlight whichever segment contains the current speaking position
  let charPos = 0
  const segPositions = segments.map(seg => {
    const start = charPos
    charPos += seg.text.length
    return { start, end: charPos }
  })

  return (
    <span style={{ fontFamily: 'Noto Sans JP' }}>
      {segments.map((seg, i) => {
        const { start, end } = segPositions[i]
        const isHighlighted = highlightCharIndex >= 0 && highlightCharIndex >= start && highlightCharIndex < end
        const isPast = highlightCharIndex >= 0 && highlightCharIndex >= end

        if (!seg.isVocab) {
          return (
            <span
              key={i}
              className="transition-all duration-100"
              style={{
                backgroundColor: isHighlighted ? '#DBEAFE' : undefined,
                borderRadius: isHighlighted ? '3px' : undefined,
                padding: isHighlighted ? '1px 2px' : undefined,
                opacity: isPast ? 0.5 : 1,
              }}
            >
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
            className="cursor-pointer transition-all duration-100 rounded-sm px-[1px] hover:opacity-80"
            style={{
              borderBottom: `2px solid ${posStyle.underline}`,
              paddingBottom: '1px',
              backgroundColor: isHighlighted ? '#DBEAFE' : undefined,
              opacity: isPast ? 0.5 : 1,
            }}
          >
            {showFurigana ? renderWithFurigana(originalWord, true) : seg.text}
          </span>
        )
      })}
    </span>
  )
}

// Helper: find the original chunk in text that corresponds to a plain segment
function findOriginalChunk(originalText: string, plainChunk: string): string {
  // Simple approach: try to find the plain chunk in original and extract with furigana
  const regex = new RegExp(
    plainChunk.split('').map(c => {
      // Each kanji character might have (reading) after it
      if (/[一-龥々]/.test(c)) {
        return c + '(?:\\([ぁ-んァ-ヶー]+\\))?'
      }
      return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }).join(''),
  )
  const match = originalText.match(regex)
  if (match) return match[0]
  // Fallback: return plain
  return plainChunk
}

// ---------------------------------------------------------------------------
// Chat Page
// ---------------------------------------------------------------------------

export default function StudioSessionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const sessionId = params.sessionId as string

  // Mode settings from URL params
  const [voiceReplyMode, setVoiceReplyMode] = useState(false)
  // characterAudioMode removed — audio is now per-message via 🔊 button
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    setVoiceReplyMode(searchParams.get('voice') === '1')
  }, [searchParams])

  const globalShowFurigana = useAppStore((s) => s.showFurigana)
  const globalShowTranslation = useAppStore((s) => s.showTranslation)
  const userProfile = useAppStore((s) => s.userProfile)

  // Local toggles (initialized from global settings, togglable in-chat)
  const [showFurigana, setShowFurigana] = useState(true)
  const [showTranslation, setShowTranslation] = useState(true)
  const [showRomaji, setShowRomaji] = useState(true)
  const [showCoachNotes, setShowCoachNotes] = useState(true)

  // Sync with global on mount
  useEffect(() => {
    setShowFurigana(globalShowFurigana)
    setShowTranslation(globalShowTranslation)
  }, [globalShowFurigana, globalShowTranslation])

  const [session, setSession] = useState<SessionData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [animatedChars, setAnimatedChars] = useState(0)
  const [pendingMessage, setPendingMessage] = useState<Message | null>(null)
  const animateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnding, setIsEnding] = useState(false)
  const [lessonBlocks, setLessonBlocks] = useState<LessonBlock[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showTypeOwn, setShowTypeOwn] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  // English → translate flow
  const [translateInput, setTranslateInput] = useState('')
  const [translating, setTranslating] = useState(false)
  const [translated, setTranslated] = useState<TranslatedResponse | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(true)
  const [activeVocab, setActiveVocab] = useState<VocabWord | null>(null)
  const [vocabPopupRect, setVocabPopupRect] = useState<DOMRect | null>(null)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const [speakingCharIndex, setSpeakingCharIndex] = useState<number>(-1)
  const highlightTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // The latest set of options (from last character message)
  const latestOptions: ResponseOption[] =
    messages.length > 0
      ? (messages.filter((m) => m.role === 'character').slice(-1)[0]?.options ?? [])
      : []

  // ── TTS: ElevenLabs speech with timer-based highlighting ──────────────
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (highlightTimerRef.current) {
      clearInterval(highlightTimerRef.current)
      highlightTimerRef.current = null
    }
    setSpeakingMsgId(null)
    setSpeakingCharIndex(-1)
  }, [])

  // Browser TTS fallback when ElevenLabs is unavailable
  const speakWithBrowserTTS = useCallback((cleanText: string, msgId?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.85

    const voices = window.speechSynthesis.getVoices()
    const jpVoice = voices.find(v => v.lang.startsWith('ja'))
    if (jpVoice) utterance.voice = jpVoice

    // Timer-based highlighting
    if (msgId) {
      const charsPerSecond = 5.5
      const msPerChar = 1000 / charsPerSecond / utterance.rate
      let charIdx = 0
      utterance.onstart = () => {
        highlightTimerRef.current = setInterval(() => {
          charIdx++
          if (charIdx >= cleanText.length && highlightTimerRef.current) {
            clearInterval(highlightTimerRef.current)
            highlightTimerRef.current = null
          }
          setSpeakingCharIndex(charIdx)
        }, msPerChar)
      }
    }

    utterance.onend = () => stopSpeaking()
    utterance.onerror = () => stopSpeaking()
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [stopSpeaking])

  const speakJapanese = useCallback(async (text: string, msgId?: string) => {
    // Toggle off if already speaking this message
    if (speakingMsgId === msgId) {
      stopSpeaking()
      return
    }

    stopSpeaking()

    const cleanText = stripFurigana(text)

    if (msgId) {
      setSpeakingMsgId(msgId)
      setSpeakingCharIndex(0)
    }

    // Try ElevenLabs first
    try {
      const res = await fetch('/api/studio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voiceId: session?.voiceId || 'JOcmGzB8OFjY8MhjHHEf',
          characterDescription: session?.characterDescription || '',
          coachNote: '',
        }),
      })

      if (!res.ok) {
        // ElevenLabs failed (402 = no credits, 500 = error) → fallback
        console.warn('[TTS] ElevenLabs failed:', res.status, '— using browser TTS')
        speakWithBrowserTTS(cleanText, msgId)
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      // Timer-based highlighting
      if (msgId) {
        const charsPerSecond = 5
        const msPerChar = 1000 / charsPerSecond
        let charIdx = 0

        audio.onplay = () => {
          highlightTimerRef.current = setInterval(() => {
            charIdx++
            if (charIdx >= cleanText.length && highlightTimerRef.current) {
              clearInterval(highlightTimerRef.current)
              highlightTimerRef.current = null
            }
            setSpeakingCharIndex(charIdx)
          }, msPerChar)
        }
      }

      audio.onended = () => {
        stopSpeaking()
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        stopSpeaking()
        URL.revokeObjectURL(url)
      }

      await audio.play()
    } catch (err) {
      // Network error or other failure → fallback
      console.warn('[TTS] ElevenLabs error, using browser TTS:', err)
      speakWithBrowserTTS(cleanText, msgId)
    }
  }, [session?.voiceId, session?.characterDescription, speakingMsgId, stopSpeaking, speakWithBrowserTTS])

  // ── STT: Listen for user's spoken Japanese ────────────────────────────
  const startListening = useCallback((targetText: string, onMatch: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition not supported. Try Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'ja-JP'
    recognition.continuous = false
    recognition.interimResults = false

    setIsListening(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string
      const confidence = event.results[0][0].confidence as number
      const cleanTarget = stripFurigana(targetText).replace(/[。！？、]/g, '')
      const cleanTranscript = transcript.replace(/[。！？、]/g, '')

      // Fuzzy match — if they got at least 50% of the characters right, accept it
      const targetChars = cleanTarget.split('')
      const matchCount = targetChars.filter(c => cleanTranscript.includes(c)).length
      const matchRatio = targetChars.length > 0 ? matchCount / targetChars.length : 0

      if (matchRatio >= 0.5 || confidence >= 0.6) {
        onMatch()
      } else {
        // Give them another try — flash a hint
        alert(`Heard: ${transcript}\nTry again! Say: ${cleanTarget}`)
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }, [])

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingText, scrollToBottom])

  // Load session
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch(`/api/studio/sessions/${sessionId}`)
        if (!res.ok) throw new Error('Failed to load session')
        const data: SessionData = await res.json()
        setSession(data)

        // Re-parse existing messages to extract options
        const parsedMessages: Message[] = (data.messages || []).map((msg) => {
          if (msg.role === 'character') {
            const fullText = msg.coachNote
              ? `${msg.content}---COACH---${msg.coachNote}`
              : msg.content
            const parsed = parseCharacterResponse(fullText)
            return {
              ...msg,
              content: parsed.characterContent,
              romaji: parsed.romajiContent || msg.romaji,
              english: parsed.englishContent || msg.english,
              vocab: parsed.vocabList.length > 0 ? parsed.vocabList : msg.vocab,
              coachNote: parsed.coachNote || msg.coachNote,
              options: parsed.options.length > 0 ? parsed.options : undefined,
            }
          }
          return msg
        })
        setMessages(parsedMessages)
      } catch (err) {
        console.error('Load error:', err)
        setError('Failed to load session. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    if (sessionId) loadSession()
  }, [sessionId])

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px'
  }, [])

  // Send a message (from option or typed)
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

      setMessages((prev) => [...prev, userMsg])
      setInputText('')
      setShowTypeOwn(false)
      setIsStreaming(true)
      setStreamingText('')

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      try {
        const res = await fetch(`/api/studio/sessions/${sessionId}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text.trim() }),
        })

        if (!res.ok) throw new Error('Failed to send message')
        if (!res.body) throw new Error('No response body')

        // Collect the FULL response silently — only show typing dots
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
        }

        // Parse the complete response
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

        // Now animate the dialogue out smoothly
        setIsStreaming(false)
        setStreamingText('')
        setPendingMessage(characterMsg)
        setIsAnimating(true)
        setAnimatedChars(0)

        const fullText = stripFurigana(parsed.characterContent)
        const totalChars = fullText.length
        const msPerChar = Math.max(30, Math.min(80, 2000 / totalChars)) // 2s total, clamped 30-80ms per char
        let charCount = 0

        animateTimerRef.current = setInterval(() => {
          charCount++
          setAnimatedChars(charCount)
          if (charCount >= totalChars) {
            if (animateTimerRef.current) clearInterval(animateTimerRef.current)
            animateTimerRef.current = null
            // Animation done — commit the full message
            setMessages((prev) => [...prev, characterMsg])
            setPendingMessage(null)
            setIsAnimating(false)
            setAnimatedChars(0)
          }
        }, msPerChar)

        // Don't add to messages yet — the animation timer does it
      } catch (err) {
        console.error('Send error:', err)
        setError('Failed to send message. Please try again.')
      } finally {
        setIsStreaming(false)
        setSelectedOptionId(null)
      }
    },
    [isStreaming, sessionId],
  )

  // Translate English → Japanese via API
  const handleTranslate = useCallback(async () => {
    if (!translateInput.trim() || translating) return
    setTranslating(true)
    setShowBreakdown(true)
    try {
      // Find the latest character message for context
      const lastChar = [...messages].reverse().find((m) => m.role === 'character')
      const characterLine = lastChar ? stripFurigana(lastChar.content) : ''
      const characterLineEN = lastChar?.english || ''

      // Build previousExchanges from prior character/user pairs
      const previousExchanges: {
        characterLine: string
        characterLineEN: string
        userJP: string
        userEN: string
      }[] = []
      for (let i = 0; i < messages.length - 1; i++) {
        const m = messages[i]
        const next = messages[i + 1]
        if (m.role === 'character' && next?.role === 'user') {
          previousExchanges.push({
            characterLine: stripFurigana(m.content),
            characterLineEN: m.english || '',
            userJP: next.content,
            userEN: next.userEnglish || '',
          })
        }
      }

      const res = await fetch('/api/lessons/translate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEnglish: translateInput,
          characterLine,
          characterLineEN,
          setting: session?.scenarioTitle || 'A conversation in Japan',
          characterName: session?.characterName || '',
          previousExchanges,
          userProfile,
        }),
      })
      const data = await res.json()
      if (data.translation) {
        setTranslated(data.translation)
        setTimeout(() => speakJapanese(data.translation.japanese), 300)
      }
    } catch (err) {
      console.error('Translate error:', err)
    }
    setTranslating(false)
  }, [translateInput, translating, messages, session, speakJapanese, userProfile])

  const handleSendTranslated = useCallback(() => {
    if (!translated) return
    const jp = translated.japanese
    const en = translateInput
    setTranslated(null)
    setTranslateInput('')
    sendText(jp, en)
  }, [translated, translateInput, sendText])

  const handleTryAgain = useCallback(() => {
    setTranslated(null)
  }, [])

  // Select an option
  const selectOption = useCallback(
    (option: ResponseOption) => {
      setSelectedOptionId(option.id)
      // Brief visual feedback then send
      setTimeout(() => {
        sendText(option.japanese)
      }, 250)
    },
    [sendText],
  )

  // Handle key press in text input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendText(inputText)
      }
    },
    [sendText, inputText],
  )

  // End session and get lesson
  const endSession = useCallback(async () => {
    setIsEnding(true)
    try {
      const res = await fetch(`/api/studio/sessions/${sessionId}/end`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to end session')
      const data = await res.json()
      setLessonBlocks(data.blocks || [])
    } catch (err) {
      console.error('End error:', err)
      setError('Failed to generate lesson. Please try again.')
    } finally {
      setIsEnding(false)
    }
  }, [sessionId])



  // ---- Loading State -------------------------------------------------------
  if (isLoading) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ backgroundColor: '#FDFBF8' }}
      >
        <div className="text-center ink-in">
          <div className="w-12 h-12 border-4 border-[#1B4F8A]/20 border-t-[#1B4F8A] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold" style={{ color: '#6B6560' }}>
            Loading conversation...
          </p>
        </div>
      </div>
    )
  }

  // ---- Error State ---------------------------------------------------------
  if (error && !session) {
    return (
      <div
        className="h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#FDFBF8' }}
      >
        <Card variant="elevated" padding="lg" className="max-w-sm w-full text-center">
          <p className="text-4xl mb-3">😵</p>
          <p className="font-bold mb-2" style={{ color: '#1A1814' }}>
            Something went wrong
          </p>
          <p className="text-sm mb-4" style={{ color: '#6B6560' }}>
            {error}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  // Should we show options at the bottom? Only if not streaming, no lesson, and last msg is character
  const showOptions =
    !isStreaming &&
    !isAnimating &&
    !lessonBlocks &&
    latestOptions.length > 0 &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === 'character'

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#FDFBF8' }}>
      {/* ---- Top Bar -------------------------------------------------------- */}
      <div className="shrink-0 bg-[#FDFBF8]/80 backdrop-blur-md border-b border-[#E0DAD2]/50 safe-top z-30">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden border-2 border-white shadow-sm">
              {session?.characterAvatar ? (
                <Image src={session.characterAvatar} alt="" width={40} height={40} className="w-full h-full object-cover" quality={90} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: session?.characterColor || '#1B4F8A' }}>{session?.characterName?.[0] || '?'}</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate" style={{ color: '#1A1814' }}>
                {session?.characterName || 'Character'}
              </p>
              <p className="text-[10px] truncate" style={{ color: '#9E9892' }}>
                {session?.scenarioEmoji} {session?.scenarioTitle}
              </p>
            </div>
          </div>

          <button
            onClick={endSession}
            disabled={isEnding || messages.length < 2}
            className="px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-[#F5EEEE] text-[#8B3A3A] border border-[#D4BABA] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {isEnding ? '...' : 'End'}
          </button>
        </div>

        {/* Toggle pills row */}
        <div className="px-4 pb-2 flex items-center gap-1.5 overflow-x-auto">
          {[
            { key: 'furigana', label: 'ふりがな', active: showFurigana, toggle: () => setShowFurigana(p => !p) },
            { key: 'romaji', label: 'romaji', active: showRomaji, toggle: () => setShowRomaji(p => !p) },
            { key: 'english', label: 'EN', active: showTranslation, toggle: () => setShowTranslation(p => !p) },
            { key: 'coach', label: '💡', active: showCoachNotes, toggle: () => setShowCoachNotes(p => !p) },
            { key: 'voice', label: '🎤', active: voiceReplyMode, toggle: () => setVoiceReplyMode(p => !p) },
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
      </div>

      {/* ---- Messages ------------------------------------------------------- */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-bounce"
      >
        {/* Opening context */}
        {session && messages.length === 0 && !isStreaming && (
          <div className="text-center py-6 ink-in">
            <span className="text-5xl block mb-3">{session.scenarioEmoji}</span>
            <p className="text-base font-semibold" style={{ color: '#1A1814' }}>
              {session.scenarioTitle}
            </p>
            <p className="text-sm mt-0.5" style={{ fontFamily: 'Noto Sans JP', color: '#9E9892' }}>
              {session.scenarioTitleJP}
            </p>
            <p className="text-sm mt-3 max-w-xs mx-auto" style={{ color: '#6B6560' }}>
              Pick a response below to start the conversation. Don&apos;t worry about mistakes — your coach will help!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'character' ? (
              /* Character message */
              <div className="flex items-end gap-2 max-w-[85%]">
                <div
                  className="w-9 h-9 rounded-full shrink-0 mb-1 overflow-hidden border-2 border-white shadow-sm"
                >
                  {session?.characterAvatar ? (
                    <Image src={session.characterAvatar} alt="" width={36} height={36} className="w-full h-full object-cover" quality={90} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: session?.characterColor || '#1B4F8A' }}>{session?.characterName?.[0] || '?'}</div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="bg-[#FDFBF8] px-4 py-3 border border-[#E0DAD2]" style={{ borderRadius: '2px 12px 12px 12px' }}>
                    {/* Japanese dialogue with furigana + clickable vocab + speaker */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-[15px] leading-[2] whitespace-pre-wrap">
                          <DialogueText
                            text={msg.content}
                            vocab={msg.vocab}
                            showFurigana={showFurigana}
                            highlightCharIndex={speakingMsgId === msg.id ? speakingCharIndex : -1}
                            onWordClick={(word, rect) => {
                              setActiveVocab(activeVocab?.word === word.word ? null : word)
                              setVocabPopupRect(rect)
                            }}
                          />
                        </p>
                        {/* Romaji */}
                        {showRomaji && msg.romaji && (
                          <p className="text-[11px] mt-1 leading-relaxed" style={{ fontFamily: 'DM Mono, monospace', color: '#B0B0B0' }}>
                            {msg.romaji}
                          </p>
                        )}
                        {/* English translation */}
                        {showTranslation && msg.english && (
                          <p className="text-xs mt-1 italic leading-relaxed" style={{ color: '#9E9892' }}>
                            {msg.english}
                          </p>
                        )}
                      </div>
                      {/* Speaker button — tap to play, tap again to stop */}
                      <button
                        onClick={() => speakJapanese(msg.content, msg.id)}
                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all mt-0.5 ${
                          speakingMsgId === msg.id
                            ? 'bg-[#1B4F8A] text-white'
                            : 'bg-[#FDFBF8] text-[#9E9892] hover:bg-[#EBF0F8] hover:text-[#1B4F8A] border border-[#E0DAD2]'
                        }`}
                      >
                        {speakingMsgId === msg.id ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Cultural insight */}
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
              /* User message */
              <div className="flex flex-col items-end">
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
                {msg.userEnglish && (
                  <p
                    className="text-xs italic mt-1 mr-1 max-w-[85%] text-right"
                    style={{ color: '#9E9892', fontFamily: 'DM Sans, sans-serif' }}
                  >
                    &ldquo;{msg.userEnglish}&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Bouncing dots — while Claude generates */}
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

        {/* Animated typewriter — after Claude finishes, reveals text smoothly */}
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

        {/* Inline error */}
        {error && session && (
          <div className="text-center py-2">
            <p className="text-sm text-[#8B3A3A] font-semibold">
              {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-[#6B6560] underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ---- English → Translate flow ------------------------------------ */}
        {!lessonBlocks && !isStreaming && !isAnimating && messages.length > 0 && messages[messages.length - 1]?.role === 'character' && (
          <div className="pt-2 space-y-3">
            {translated ? (
              <div className="space-y-3 ink-in">
                {/* Translated Japanese bubble */}
                <div className="flex justify-end">
                  <div
                    className="bg-[#1B4F8A] px-4 py-3 max-w-[85%]"
                    style={{ borderRadius: '10px 2px 10px 10px' }}
                  >
                    <p
                      className="text-white text-[17px] leading-relaxed"
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
                      onClick={() => speakJapanese(translated.japanese)}
                      className="text-white/40 text-xs mt-1 hover:text-white/70 transition-colors flex items-center gap-1"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      🔊 Hear your response
                    </button>
                  </div>
                </div>

                {/* Breakdown card */}
                <div className="bg-[#FDFBF8] rounded-[10px] border border-[#E0DAD2] overflow-hidden">
                  <button
                    onClick={() => setShowBreakdown((b) => !b)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F5F0EB] transition-colors"
                  >
                    <p
                      className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      Breaking it down
                    </p>
                    <span className="text-[#C8C3BC] text-xs">{showBreakdown ? '▲' : '▼'}</span>
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
                          💬 {translated.naturalness}
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

                {/* Send + Try again */}
                <button
                  onClick={handleSendTranslated}
                  className="w-full bg-[#1B4F8A] hover:bg-[#4A7AB5] text-white font-medium py-3 rounded-[8px] transition-colors"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  Send →
                </button>
                <div className="text-center">
                  <button
                    onClick={handleTryAgain}
                    className="text-xs font-medium text-[#9E9892] hover:text-[#1B4F8A] transition-colors"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    ← Try different wording
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p
                  className="text-xs text-[#9E9892] text-center"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  Say what you want in English — we&apos;ll translate it
                </p>
                <div className="bg-[#FDFBF8] rounded-[10px] border-2 border-[#E0DAD2] focus-within:border-[#1B4F8A] transition-colors overflow-hidden">
                  <textarea
                    value={translateInput}
                    onChange={(e) => setTranslateInput(e.target.value)}
                    onKeyDown={(e) => {
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
                      disabled={!translateInput.trim() || translating}
                      className={`text-xs font-medium px-3 py-1.5 rounded-[6px] transition-all ${
                        translateInput.trim() && !translating
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

        {/* ---- Response Options (DISABLED — replaced by English translate flow) */}
        {false && showOptions && !showTypeOwn && (
          <div className="space-y-1.5 pt-2">
            {voiceReplyMode && (
              <p className="text-[10px] text-center font-bold mb-1" style={{ color: '#9E9892' }}>
                🎤 Say one of these out loud
              </p>
            )}
            {latestOptions.map((option, idx) => {
              const style = DIFFICULTY_STYLES[option.difficulty] || DIFFICULTY_STYLES.natural
              const isSelected = selectedOptionId === option.id
              return (
                <div
                  key={option.id}
                  className={`w-full text-left px-3.5 py-2.5 bg-[#FDFBF8] rounded-[8px] border transition-all ${
                    isSelected ? 'scale-[0.97] border-[#3D6B4F]' : 'border-[#E0DAD2]'
                  } ${!voiceReplyMode ? 'cursor-pointer active:translate-y-px' : ''}`}
                  style={{
                    animationDelay: `${idx * 150}ms`,
                  }}
                  onClick={!voiceReplyMode ? () => selectOption(option) : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Difficulty dot */}
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: style.border }} />

                    <div className="flex-1 min-w-0">
                      {/* Japanese */}
                      <p className="text-sm font-bold leading-snug" style={{ fontFamily: 'Noto Sans JP', color: '#1A1814' }}>
                        {renderWithFurigana(option.japanese, showFurigana)}
                      </p>
                      {/* Romaji */}
                      {showRomaji && (
                        <p className="text-[10px] mt-0.5" style={{ fontFamily: 'DM Mono, monospace', color: '#B0B0B0' }}>
                          {option.romaji}
                        </p>
                      )}
                      {/* English */}
                      {showTranslation && (
                        <p className="text-xs mt-0.5 italic" style={{ color: '#9E9892' }}>
                          {option.english}
                        </p>
                      )}
                    </div>

                    {/* Voice mode: mic button per option */}
                    {voiceReplyMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startListening(option.japanese, () => selectOption(option))
                        }}
                        disabled={isListening || isStreaming || !!selectedOptionId}
                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#EBF0F8] text-[#1B4F8A] hover:bg-[#1B4F8A] hover:text-white'
                        } disabled:opacity-40`}
                      >
                        <span className="text-sm">{isListening ? '●' : '🎤'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Type my own */}
            <div className="text-center pt-0.5 pb-1">
              <button
                onClick={() => setShowTypeOwn(true)}
                className="text-[10px] font-bold transition-colors hover:text-[#1B4F8A]"
                style={{ color: '#9E9892' }}
              >
                ✏️ Type my own
              </button>
            </div>
          </div>
        )}

        {/* ---- Type-your-own input (expanded) ------------------------------ */}
        {false && showOptions && showTypeOwn && !isStreaming && (
          <div className="pt-2 space-y-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type in Japanese..."
                rows={1}
                className="flex-1 px-4 py-3 rounded-[8px] border border-[#E0DAD2] bg-[#FDFBF8] text-[15px] resize-none leading-relaxed focus:outline-none focus:border-[#1B4F8A] transition-colors placeholder:text-[#9E9892]"
                style={{ fontFamily: 'Noto Sans JP', color: '#1A1814', maxHeight: '160px' }}
              />
              <button
                onClick={() => sendText(inputText)}
                disabled={!inputText.trim()}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
                style={{
                  backgroundColor: inputText.trim() ? '#1B4F8A' : '#B8CBE0',
                  /* no cartoon shadow */
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
            <div className="text-center">
              <button
                onClick={() => setShowTypeOwn(false)}
                className="text-xs font-bold underline transition-colors hover:text-[#1B4F8A]"
                style={{ color: '#9E9892' }}
              >
                Back to options
              </button>
            </div>
          </div>
        )}

        {/* ---- Fallback text input when no options available (DISABLED) --- */}
        {false && !lessonBlocks && !showOptions && !isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === 'character' && (
          <div className="pt-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type in Japanese..."
                rows={1}
                className="flex-1 px-4 py-3 rounded-[8px] border border-[#E0DAD2] bg-[#FDFBF8] text-[15px] resize-none leading-relaxed focus:outline-none focus:border-[#1B4F8A] transition-colors placeholder:text-[#9E9892]"
                style={{ fontFamily: 'Noto Sans JP', color: '#1A1814', maxHeight: '160px' }}
              />
              <button
                onClick={() => sendText(inputText)}
                disabled={!inputText.trim()}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
                style={{
                  backgroundColor: inputText.trim() ? '#1B4F8A' : '#B8CBE0',
                  /* no cartoon shadow */
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Lesson Results */}
        {lessonBlocks && (
          <div className="pt-4 space-y-4 ink-in">
            <div className="text-center py-4">
              <span className="text-4xl block mb-2">🎉</span>
              <p className="text-lg font-semibold" style={{ color: '#1A1814' }}>
                Great conversation!
              </p>
              <p className="text-sm mt-1" style={{ color: '#6B6560' }}>
                Here&apos;s what you practiced:
              </p>
            </div>

            {lessonBlocks.map((block, blockIdx) => (
              <Card key={blockIdx} variant="elevated" padding="lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">
                    {block.type === 'vocab' ? '📝' : block.type === 'grammar' ? '📐' : '🏮'}
                  </span>
                  <h3 className="font-semibold text-base" style={{ color: '#1A1814' }}>
                    {block.title}
                  </h3>
                  <Badge
                    color={block.type === 'vocab' ? 'blue' : block.type === 'grammar' ? 'purple' : 'gold'}
                    size="sm"
                  >
                    {block.type}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {block.items.map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (item: any, itemIdx: number) => (
                      <div key={itemIdx} className="p-3 rounded-[6px] bg-[#FDFBF8] border border-[#E0DAD2]">
                        {item.word && (
                          <p className="font-bold text-sm" style={{ fontFamily: 'Noto Sans JP', color: '#1B4F8A' }}>
                            {item.word}
                            {item.reading && (
                              <span className="font-normal ml-2 text-xs" style={{ color: '#9E9892' }}>
                                {item.reading}
                              </span>
                            )}
                          </p>
                        )}
                        {item.meaning && (
                          <p className="text-sm mt-0.5" style={{ color: '#6B6560' }}>
                            {item.meaning}
                          </p>
                        )}
                        {item.pattern && (
                          <p className="font-bold text-sm" style={{ fontFamily: 'Noto Sans JP', color: '#1B4F8A' }}>
                            {item.pattern}
                          </p>
                        )}
                        {item.explanation && (
                          <p className="text-sm mt-0.5" style={{ color: '#6B6560' }}>
                            {item.explanation}
                          </p>
                        )}
                        {item.example && (
                          <p className="text-xs mt-1 italic" style={{ fontFamily: 'Noto Sans JP', color: '#9E9892' }}>
                            {item.example}
                          </p>
                        )}
                        {item.note && (
                          <p className="text-sm" style={{ color: '#6B6560' }}>
                            {item.note}
                          </p>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </Card>
            ))}

            <div className="pt-2 pb-8">
              <Button variant="primary" size="lg" fullWidth onClick={() => (window.location.href = '/studio')}>
                Back to Scenarios
              </Button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ---- Slide-up animation style ------------------------------------ */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* ---- Vocab Popup -------------------------------------------------- */}
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

// ---------------------------------------------------------------------------
// Vocab Popup — dictionary widget
// ---------------------------------------------------------------------------

function VocabPopup({ word, rect, onClose }: { word: VocabWord; rect: DOMRect; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const posStyle = POS_COLORS[word.pos] || POS_COLORS.noun

  // Position below the word, flip up if too close to bottom
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

  const addToSRS = () => {
    const deck = JSON.parse(localStorage.getItem('zlang_srs') || '{}')
    deck[stripFurigana(word.word)] = {
      word: stripFurigana(word.word),
      reading: word.reading,
      romaji: word.romaji,
      meaning: word.meaning,
      pos: word.pos,
      nextReview: new Date(Date.now() + 86400000).toISOString(),
      confidence: 1,
      reviews: 0,
    }
    localStorage.setItem('zlang_srs', JSON.stringify(deck))
    onClose()
  }

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
      {/* POS color bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: posStyle.underline }} />

      <div className="p-3.5">
        {/* Word + reading */}
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
          {/* POS badge */}
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: posStyle.bg, color: posStyle.text }}
          >
            {posStyle.label} · {word.pos}
          </span>
        </div>

        {/* Meaning */}
        <p className="text-sm font-semibold mb-2.5" style={{ color: '#1A1814' }}>
          {word.meaning}
        </p>

        {/* Add to deck */}
        <button
          onClick={addToSRS}
          className="w-full py-2 rounded-[6px] text-xs font-semibold text-white transition-all hover:brightness-110 active:translate-y-px"
          style={{ backgroundColor: '#1B4F8A' }}
        >
          + Add to vocab deck
        </button>
      </div>
    </div>
  )
}
