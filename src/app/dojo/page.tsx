'use client'

// ---------------------------------------------------------------------------
// Translation keys used (add to useAppStore if missing):
//   dojo.title, dojo.subtitle, dojo.selectScenario, dojo.endSession,
//   dojo.sendMessage, dojo.placeholder, dojo.debrief.title,
//   dojo.debrief.overall, dojo.debrief.naturalness, dojo.debrief.accuracy,
//   dojo.debrief.culturalFit, dojo.debrief.highlights, dojo.debrief.improve,
//   dojo.debrief.messagesSent, dojo.debrief.newVocab, dojo.debrief.backToDash,
//   dojo.debrief.minExchanges, dojo.loading
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ScenarioCard from '@/components/dojo/ScenarioCard'
import ConversationBubble from '@/components/dojo/ConversationBubble'
import { useAppStore } from '@/store/useAppStore'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Scenario {
  id: string
  emoji: string
  title: string
  titleJP: string
  description: string
  descriptionJP: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  systemPrompt: string
  avatarEmoji: string
  characterName: string
}

interface ChatMessage {
  role: 'character' | 'user'
  text: string
  coachNote?: string
}

interface DebriefData {
  overallScore: number
  naturalness: number
  accuracy: number
  culturalFit: number
  highlights: string[]
  improvements: string[]
  messagesSent: number
  newVocab: string[]
}

// ---------------------------------------------------------------------------
// Scenario data
// ---------------------------------------------------------------------------

const enToJpScenarios: Scenario[] = [
  {
    id: 'convenience-store',
    emoji: '🏪',
    title: 'Convenience Store',
    titleJP: 'コンビニエンスストア',
    description: 'Practice polite Japanese with a store clerk',
    descriptionJP: '店員さんと丁寧な日本語を練習',
    difficulty: 'Beginner',
    systemPrompt:
      'You are a friendly convenience store clerk in Tokyo. Speak in natural Japanese appropriate to the user\'s level. Use polite (desu/masu) form. The user is a customer buying items. Include realistic shop interactions (greeting, asking about points cards, bagging items). After each of your messages, provide a brief coach note in English explaining any grammar, vocabulary, or cultural context.',
    avatarEmoji: '🏪',
    characterName: '店員さん',
  },
  {
    id: 'ramen-shop',
    emoji: '🍜',
    title: 'Ramen Shop',
    titleJP: 'ラーメン屋',
    description: 'Order food and chat with the chef',
    descriptionJP: '食べ物を注文してシェフと会話',
    difficulty: 'Beginner',
    systemPrompt:
      'You are a passionate ramen shop chef in a small shop in Osaka. Speak natural Japanese. You love talking about your ramen and its ingredients. Be warm and encouraging. Help the user order, ask about their preferences (spice level, noodle firmness, toppings). After each of your messages, provide a brief coach note in English explaining any grammar, vocabulary, or cultural context.',
    avatarEmoji: '🍜',
    characterName: '大将',
  },
  {
    id: 'train-station',
    emoji: '🚉',
    title: 'Train Station',
    titleJP: '駅',
    description: 'Ask for directions in Japanese',
    descriptionJP: '日本語で道を尋ねる',
    difficulty: 'Intermediate',
    systemPrompt:
      'You are a helpful station attendant at Shinjuku Station in Tokyo. The user is trying to navigate the complex station. Speak polite Japanese. Help them find the right platform, explain transfers, and mention useful landmarks. After each of your messages, provide a brief coach note in English explaining any grammar, vocabulary, or cultural context.',
    avatarEmoji: '🚉',
    characterName: '駅員さん',
  },
  {
    id: 'temple-visit',
    emoji: '🏯',
    title: 'Temple Visit',
    titleJP: '寺院参拝',
    description: 'Learn about cultural etiquette',
    descriptionJP: '文化的なマナーを学ぶ',
    difficulty: 'Advanced',
    systemPrompt:
      'You are an elderly temple guide at a famous Buddhist temple in Kyoto. Speak in natural but slightly more formal Japanese. Explain purification rituals, proper prayer etiquette, temple history, and cultural significance. Use some more advanced vocabulary and grammar naturally. After each of your messages, provide a brief coach note in English explaining any grammar, vocabulary, or cultural context.',
    avatarEmoji: '🏯',
    characterName: '案内人',
  },
]

const jpToEnScenarios: Scenario[] = [
  {
    id: 'at-the-game',
    emoji: '🏀',
    title: 'At the Game',
    titleJP: '試合観戦',
    description: 'Talk basketball with American fans',
    descriptionJP: 'アメリカのファンとバスケの話',
    difficulty: 'Beginner',
    systemPrompt:
      'You are an enthusiastic American basketball fan sitting next to the user at an NBA game. Speak natural casual English. Use common sports expressions, slang, and excitement. Help the user practice conversational English about sports. After each of your messages, provide a brief coach note in Japanese explaining any grammar, vocabulary, or cultural context.',
    avatarEmoji: '🏀',
    characterName: 'Mike',
  },
  {
    id: 'house-party',
    emoji: '🎉',
    title: 'House Party',
    titleJP: 'ホームパーティー',
    description: 'Navigate casual social conversation',
    descriptionJP: 'カジュアルな社交会話を楽しむ',
    difficulty: 'Intermediate',
    systemPrompt:
      'You are a friendly American college student at a house party. The user just arrived and doesn\'t know many people. Use casual, natural English with some slang. Make small talk, introduce them to others, talk about music, school, etc. After each of your messages, provide a brief coach note in Japanese explaining any grammar, vocabulary, or cultural context.',
    avatarEmoji: '🎉',
    characterName: 'Sarah',
  },
  {
    id: 'job-interview',
    emoji: '💼',
    title: 'Job Interview',
    titleJP: '就職面接',
    description: 'Practice professional English',
    descriptionJP: 'プロフェッショナルな英語を練習',
    difficulty: 'Advanced',
    systemPrompt:
      'You are a hiring manager at a tech company in San Francisco conducting a job interview. Use professional, formal English. Ask about their experience, skills, and motivations. Give them opportunities to practice professional English. After each of your messages, provide a brief coach note in Japanese explaining any grammar, vocabulary, or cultural context.',
    avatarEmoji: '💼',
    characterName: 'Mr. Johnson',
  },
  {
    id: 'dm-text',
    emoji: '📱',
    title: 'DM/Text Conversation',
    titleJP: 'DM/テキスト会話',
    description: 'Learn texting culture',
    descriptionJP: 'テキスト文化を学ぶ',
    difficulty: 'Intermediate',
    systemPrompt:
      'You are an American friend texting with the user. Use very casual text-speak: abbreviations (lol, brb, ngl, tbh, imo), emojis, no capitalization, informal grammar. This is a text message conversation about making plans to hang out. After each of your messages, provide a brief coach note in Japanese explaining any abbreviations, slang, or cultural context.',
    avatarEmoji: '📱',
    characterName: 'Alex',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Phase = 'select' | 'chat' | 'debrief'

export default function DojoPage() {
  const corridor = useAppStore((s) => s.corridor)
  const uiLanguage = useAppStore((s) => s.uiLanguage)
  const level = useAppStore((s) => s.level)
  const incrementDojoSessions = useAppStore((s) => s.incrementDojoSessions)

  const [phase, setPhase] = useState<Phase>('select')
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [debrief, setDebrief] = useState<DebriefData | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input after scenario selection
  useEffect(() => {
    if (phase === 'chat') {
      inputRef.current?.focus()
    }
  }, [phase])

  // Determine which scenarios to show
  const scenarios =
    corridor === 'jp-to-en'
      ? jpToEnScenarios
      : corridor === 'en-to-jp'
        ? enToJpScenarios
        : [...enToJpScenarios, ...jpToEnScenarios]

  // ------- Scenario selection -------
  const handleSelectScenario = useCallback(
    async (scenario: Scenario) => {
      setSelectedScenario(scenario)
      setMessages([])
      setPhase('chat')
      setIsLoading(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'conversation',
            scenarioId: scenario.id,
            systemPrompt: scenario.systemPrompt,
            messages: [],
            corridor: corridor || 'en-to-jp',
            level,
          }),
        })

        if (!res.ok) throw new Error('Failed to start conversation')

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No reader')

        const decoder = new TextDecoder()
        let fullText = ''
        let coachNote = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk

          // Parse coach note if present (delimited by [COACH: ...])
          const coachMatch = fullText.match(/\[COACH:\s*([\s\S]*?)\]/)
          if (coachMatch) {
            coachNote = coachMatch[1].trim()
            const mainText = fullText.replace(/\[COACH:\s*[\s\S]*?\]/, '').trim()
            setMessages([
              {
                role: 'character',
                text: mainText,
                coachNote,
              },
            ])
          } else {
            setMessages([{ role: 'character', text: fullText.trim() }])
          }
        }

        // Final parse
        const finalCoachMatch = fullText.match(/\[COACH:\s*([\s\S]*?)\]/)
        if (finalCoachMatch) {
          coachNote = finalCoachMatch[1].trim()
          const mainText = fullText.replace(/\[COACH:\s*[\s\S]*?\]/, '').trim()
          setMessages([{ role: 'character', text: mainText, coachNote }])
        } else {
          setMessages([{ role: 'character', text: fullText.trim() }])
        }
      } catch {
        setMessages([
          {
            role: 'character',
            text:
              corridor === 'jp-to-en'
                ? "Hey! Welcome! Great to meet you. What brings you here today?"
                : 'いらっしゃいませ！こんにちは。何かお手伝いできますか？',
            coachNote:
              corridor === 'jp-to-en'
                ? 'このフレーズは英語の一般的な挨拶です。"What brings you here?" は「ここに来た理由は？」という意味です。'
                : '"Irasshaimase" is the standard greeting when entering a shop. "Nanika otetsudai dekimasu ka?" means "Can I help you with something?"',
          },
        ])
      }

      setIsLoading(false)
    },
    [corridor, level],
  )

  // ------- Send message -------
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !selectedScenario) return

    const userMessage: ChatMessage = { role: 'user', text: input.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'conversation',
          scenarioId: selectedScenario.id,
          systemPrompt: selectedScenario.systemPrompt,
          messages: updatedMessages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          corridor: corridor || 'en-to-jp',
          level,
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk

        const coachMatch = fullText.match(/\[COACH:\s*([\s\S]*?)\]/)
        if (coachMatch) {
          const coachNote = coachMatch[1].trim()
          const mainText = fullText.replace(/\[COACH:\s*[\s\S]*?\]/, '').trim()
          setMessages([
            ...updatedMessages,
            { role: 'character', text: mainText, coachNote },
          ])
        } else {
          setMessages([
            ...updatedMessages,
            { role: 'character', text: fullText.trim() },
          ])
        }
      }

      // Final parse
      const finalCoachMatch = fullText.match(/\[COACH:\s*([\s\S]*?)\]/)
      if (finalCoachMatch) {
        const coachNote = finalCoachMatch[1].trim()
        const mainText = fullText.replace(/\[COACH:\s*[\s\S]*?\]/, '').trim()
        setMessages([
          ...updatedMessages,
          { role: 'character', text: mainText, coachNote },
        ])
      }
    } catch {
      setMessages([
        ...updatedMessages,
        {
          role: 'character',
          text:
            corridor === 'jp-to-en'
              ? "Sorry, I didn't quite catch that. Could you say that again?"
              : 'すみません、もう一度お願いします。',
        },
      ])
    }

    setIsLoading(false)
  }, [input, isLoading, selectedScenario, messages, corridor, level])

  // ------- End session & debrief -------
  const handleEndSession = useCallback(async () => {
    const userMsgCount = messages.filter((m) => m.role === 'user').length
    if (userMsgCount < 3) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'conversation-debrief',
          scenarioId: selectedScenario?.id,
          messages: messages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          corridor: corridor || 'en-to-jp',
          level,
        }),
      })

      if (!res.ok) throw new Error('Debrief failed')

      const data = await res.json()
      setDebrief(data)
    } catch {
      // Fallback debrief
      setDebrief({
        overallScore: 3,
        naturalness: 3,
        accuracy: 3,
        culturalFit: 3,
        highlights: [
          'You engaged in the conversation',
          'Good attempt at using appropriate expressions',
        ],
        improvements: [
          'Try using more varied sentence patterns',
          'Practice polite form consistency',
        ],
        messagesSent: messages.filter((m) => m.role === 'user').length,
        newVocab: [],
      })
    }

    incrementDojoSessions()
    setPhase('debrief')
    setIsLoading(false)
  }, [messages, selectedScenario, corridor, level, incrementDojoSessions])

  // ------- Key handler for input -------
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // ------- Star display helper -------
  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < score ? 'text-accent' : 'text-white/20'}>
        ★
      </span>
    ))
  }

  // ------- Render -------
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          {/* ===== Phase 1: Scenario Selection ===== */}
          {phase === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="flex-1 max-w-4xl mx-auto w-full px-4 py-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-display font-bold text-accent text-glow mb-2">
                  {uiLanguage === 'en' ? 'Conversation Dojo' : '会話道場'}
                </h1>
                <p className="text-white/50">
                  {uiLanguage === 'en'
                    ? 'Choose a scenario to practice real conversation'
                    : 'シナリオを選んで実際の会話を練習しましょう'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenarios.map((scenario, i) => (
                  <ScenarioCard
                    key={scenario.id}
                    emoji={scenario.emoji}
                    title={uiLanguage === 'en' ? scenario.title : scenario.titleJP}
                    description={
                      uiLanguage === 'en' ? scenario.description : scenario.descriptionJP
                    }
                    difficulty={scenario.difficulty}
                    onClick={() => handleSelectScenario(scenario)}
                    delay={i * 0.08}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== Phase 2: Chat Interface ===== */}
          {phase === 'chat' && selectedScenario && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col max-w-3xl mx-auto w-full"
            >
              {/* Header bar */}
              <div className="sticky top-16 z-30 flex items-center justify-between px-4 py-3 bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedScenario.emoji}</span>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      {uiLanguage === 'en'
                        ? selectedScenario.title
                        : selectedScenario.titleJP}
                    </h2>
                    <p className="text-xs text-white/40">
                      {selectedScenario.characterName}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEndSession}
                  disabled={
                    messages.filter((m) => m.role === 'user').length < 3 || isLoading
                  }
                  className="text-white/50 hover:text-red-400"
                >
                  {uiLanguage === 'en' ? 'End Session' : 'セッション終了'}
                </Button>
              </div>

              {/* Minimum exchanges hint */}
              {messages.filter((m) => m.role === 'user').length < 3 && (
                <div className="text-center py-2">
                  <p className="text-xs text-white/30">
                    {uiLanguage === 'en'
                      ? `Send at least ${3 - messages.filter((m) => m.role === 'user').length} more message${3 - messages.filter((m) => m.role === 'user').length === 1 ? '' : 's'} to enable session debrief`
                      : `セッションレビューを有効にするにはあと${3 - messages.filter((m) => m.role === 'user').length}通送信してください`}
                  </p>
                </div>
              )}

              {/* Messages list */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map((msg, i) => (
                  <ConversationBubble
                    key={i}
                    role={msg.role}
                    avatar={selectedScenario.avatarEmoji}
                    name={
                      msg.role === 'character'
                        ? selectedScenario.characterName
                        : undefined
                    }
                    text={msg.text}
                    coachNote={msg.coachNote}
                    isStreaming={
                      isLoading &&
                      i === messages.length - 1 &&
                      msg.role === 'character'
                    }
                  />
                ))}

                {/* Loading indicator */}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg border border-white/10">
                      {selectedScenario.avatarEmoji}
                    </div>
                    <div className="glass-card px-4 py-3 rounded-2xl">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="sticky bottom-20 md:bottom-0 px-4 py-3 bg-background/80 backdrop-blur-xl border-t border-white/[0.06]">
                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      uiLanguage === 'en'
                        ? 'Type your message...'
                        : 'メッセージを入力...'
                    }
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-colors disabled:opacity-50"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    size="md"
                    ariaLabel={uiLanguage === 'en' ? 'Send message' : 'メッセージ送信'}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== Phase 3: Session Debrief ===== */}
          {phase === 'debrief' && debrief && (
            <motion.div
              key="debrief"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 max-w-2xl mx-auto w-full px-4 py-8"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-bold text-accent text-glow mb-1">
                  {uiLanguage === 'en' ? 'Session Complete!' : 'セッション完了！'}
                </h2>
                <p className="text-white/40 text-sm">
                  {uiLanguage === 'en'
                    ? selectedScenario?.title
                    : selectedScenario?.titleJP}
                </p>
              </div>

              {/* Overall score */}
              <Card padding="lg" className="mb-4">
                <div className="text-center">
                  <p className="text-sm text-white/50 mb-2">
                    {uiLanguage === 'en' ? 'Overall Score' : '総合スコア'}
                  </p>
                  <div className="text-3xl tracking-wider mb-4">
                    {renderStars(debrief.overallScore)}
                  </div>

                  {/* Category scores */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      {
                        label: uiLanguage === 'en' ? 'Naturalness' : '自然さ',
                        score: debrief.naturalness,
                      },
                      {
                        label: uiLanguage === 'en' ? 'Accuracy' : '正確さ',
                        score: debrief.accuracy,
                      },
                      {
                        label: uiLanguage === 'en' ? 'Cultural Fit' : '文化適合',
                        score: debrief.culturalFit,
                      },
                    ].map((cat) => (
                      <div key={cat.label} className="text-center">
                        <p className="text-xs text-white/40 mb-1">{cat.label}</p>
                        <div className="text-lg tracking-wider">
                          {renderStars(cat.score)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Highlights & improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Card padding="md">
                  <h3 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
                    <span>✨</span>
                    {uiLanguage === 'en' ? 'Highlights' : 'ハイライト'}
                  </h3>
                  <ul className="space-y-2">
                    {debrief.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="text-sm text-white/70 flex items-start gap-2"
                      >
                        <span className="text-accent/60 mt-0.5 shrink-0">+</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card padding="md">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                    <span>📈</span>
                    {uiLanguage === 'en' ? 'Areas to Improve' : '改善点'}
                  </h3>
                  <ul className="space-y-2">
                    {debrief.improvements.map((imp, i) => (
                      <li
                        key={i}
                        className="text-sm text-white/70 flex items-start gap-2"
                      >
                        <span className="text-yellow-400/60 mt-0.5 shrink-0">→</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Session stats */}
              <Card padding="md" className="mb-6">
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {debrief.messagesSent}
                    </p>
                    <p className="text-xs text-white/40">
                      {uiLanguage === 'en' ? 'Messages Sent' : '送信メッセージ'}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {debrief.newVocab.length}
                    </p>
                    <p className="text-xs text-white/40">
                      {uiLanguage === 'en' ? 'New Vocab' : '新出語彙'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Back to dashboard */}
              <div className="text-center">
                <Link href="/dashboard">
                  <Button variant="primary" size="lg">
                    {uiLanguage === 'en' ? 'Back to Dashboard' : 'ダッシュボードに戻る'}
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MobileNav />
    </div>
  )
}
