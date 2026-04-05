'use client'

// ---------------------------------------------------------------------------
// Translation keys used (add to useAppStore if missing):
//   humor.title, humor.locked, humor.lockedMessage, humor.lockedProgress,
//   humor.humorIQ, humor.gotIt, humor.kindOf, humor.didntGetIt,
//   humor.analyzing, humor.setup, humor.subversion, humor.cultural,
//   humor.similarJokes, humor.useThisHumor, humor.nextClip,
//   humor.congratulations, humor.backToDash, humor.watchFirst
// ---------------------------------------------------------------------------

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import { useAppStore } from '@/store/useAppStore'
import Image from 'next/image'

// ---------------------------------------------------------------------------
// Humor clip data
// ---------------------------------------------------------------------------

type HumorCategory = 'Sarcasm' | 'Irony' | 'Wordplay' | 'Physical' | 'Cultural'

interface HumorClip {
  id: string
  youtubeId: string
  title: string
  titleJP: string
  category: HumorCategory
  language: 'japanese' | 'english'
  context: string
}

const humorClips: HumorClip[] = [
  {
    id: 'humor-sarcasm-01',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'The Art of Japanese Sarcasm',
    titleJP: '日本のツッコミ芸術',
    category: 'Sarcasm',
    language: 'japanese',
    context:
      'A manzai comedy duo where the tsukkomi (straight man) reacts to absurd statements. The humor comes from exaggerated reactions and timing.',
  },
  {
    id: 'humor-irony-01',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Ironic Politeness in Japan',
    titleJP: '皮肉な丁寧さ',
    category: 'Irony',
    language: 'japanese',
    context:
      'A skit where someone uses excessively polite keigo in a casual situation, creating comedic contrast between formality and context.',
  },
  {
    id: 'humor-wordplay-01',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Japanese Puns (Dajare)',
    titleJP: 'だじゃれの世界',
    category: 'Wordplay',
    language: 'japanese',
    context:
      'Classic dajare (Japanese dad jokes) that rely on homophones. Example: futon ga futtonda (the futon flew away).',
  },
  {
    id: 'humor-physical-01',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Batsu Game Reactions',
    titleJP: '罰ゲームリアクション',
    category: 'Physical',
    language: 'japanese',
    context:
      'A variety show batsu (punishment) game where comedians must not laugh. Physical comedy and surprise elements drive the humor.',
  },
  {
    id: 'humor-cultural-01',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Lost in Translation Moments',
    titleJP: '翻訳で失われる笑い',
    category: 'Cultural',
    language: 'english',
    context:
      'Moments where direct translation creates unintentional humor due to cultural differences between English and Japanese.',
  },
  {
    id: 'humor-sarcasm-02',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Dry British Humor Explained',
    titleJP: 'イギリスのドライユーモア解説',
    category: 'Sarcasm',
    language: 'english',
    context:
      'British comedy clips demonstrating dry, deadpan sarcasm — a style often confusing for non-native English speakers.',
  },
  {
    id: 'humor-irony-02',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Situational Irony in Anime',
    titleJP: 'アニメの状況アイロニー',
    category: 'Irony',
    language: 'japanese',
    context:
      'Anime scenes where characters find themselves in situations that are the exact opposite of what they expected or planned.',
  },
  {
    id: 'humor-cultural-02',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'American vs Japanese Comedy',
    titleJP: 'アメリカと日本のコメディ比較',
    category: 'Cultural',
    language: 'english',
    context:
      'Side-by-side comparison of how Americans and Japanese approach the same comedic situations differently.',
  },
]

const categoryColors: Record<HumorCategory, 'blue' | 'green' | 'gold' | 'red' | 'gray' | 'purple'> = {
  Sarcasm: 'red',
  Irony: 'blue',
  Wordplay: 'purple',
  Physical: 'gold',
  Cultural: 'gray',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HumorLabPage() {
  const uiLanguage = useAppStore((s) => s.uiLanguage)
  const lessonsCompleted = useAppStore((s) => s.lessonsCompleted)
  const humorIQ = useAppStore((s) => s.humorIQ)
  const incrementHumorIQ = useAppStore((s) => s.incrementHumorIQ)

  const [selectedClip, setSelectedClip] = useState<HumorClip | null>(null)
  const [hasWatched, setHasWatched] = useState(false)
  const [rating, setRating] = useState<'got-it' | 'kind-of' | 'didnt-get-it' | null>(null)
  const [analysis, setAnalysis] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)

  const isUnlocked = lessonsCompleted.length >= 10

  // ------- Handle clip selection -------
  const handleSelectClip = useCallback((clip: HumorClip) => {
    setSelectedClip(clip)
    setHasWatched(false)
    setRating(null)
    setAnalysis('')
    setShowCongrats(false)
  }, [])

  // ------- Handle rating -------
  const handleRate = useCallback(
    async (r: 'got-it' | 'kind-of' | 'didnt-get-it') => {
      setRating(r)

      if (r === 'got-it') {
        incrementHumorIQ(10)
        setShowCongrats(true)
        return
      }

      // Request AI analysis
      setIsAnalyzing(true)
      setAnalysis('')

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'humor-analyze',
            clipTitle: selectedClip?.title,
            clipContext: selectedClip?.context,
            clipCategory: selectedClip?.category,
            clipLanguage: selectedClip?.language,
            userRating: r,
            uiLanguage,
          }),
        })

        if (!res.ok) throw new Error('Analysis failed')

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No reader')

        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setAnalysis(fullText)
        }

        // Increment humor IQ for trying
        incrementHumorIQ(5)
      } catch {
        setAnalysis(
          uiLanguage === 'en'
            ? `**The Setup & Expectation**\nThis clip uses ${selectedClip?.category?.toLowerCase()} humor. The comedian sets up an expectation by establishing a normal scenario.\n\n**The Moment of Subversion**\nThe punchline works by subverting what you expected. The twist catches you off guard.\n\n**Cultural Reference**\n${selectedClip?.context}\n\n**3 Similar Jokes**\n1. Try watching other ${selectedClip?.category?.toLowerCase()} clips from the same comedian\n2. Look for similar patterns in everyday conversation\n3. Notice how timing plays a crucial role\n\n**5 Ways to Use This Humor Structure**\n1. Set up a normal expectation, then twist it\n2. Use exaggeration for comedic effect\n3. Play with timing and pauses\n4. Reference shared cultural knowledge\n5. Practice the delivery — humor is 90% timing`
            : `**セットアップと期待**\nこのクリップは${selectedClip?.category}のユーモアを使っています。コメディアンは普通のシナリオを確立して期待を設定します。\n\n**転覆の瞬間**\nパンチラインは期待を裏切ることで機能します。ツイストが不意を突きます。\n\n**文化的参照**\n${selectedClip?.context}\n\n**似たようなジョーク3つ**\n1. 同じコメディアンの他の${selectedClip?.category}クリップを見てみましょう\n2. 日常会話で似たパターンを探しましょう\n3. タイミングが重要な役割を果たすことに注目\n\n**このユーモア構造を使う5つの方法**\n1. 普通の期待を設定し、それをひっくり返す\n2. コミカルな効果のために誇張を使う\n3. タイミングと間を活かす\n4. 共有された文化的知識を参照する\n5. デリバリーを練習する — ユーモアの90%はタイミング`,
        )
        incrementHumorIQ(5)
      }

      setIsAnalyzing(false)
    },
    [selectedClip, uiLanguage, incrementHumorIQ],
  )

  // ------- Move to next clip -------
  const handleNextClip = useCallback(() => {
    if (!selectedClip) return
    const currentIdx = humorClips.findIndex((c) => c.id === selectedClip.id)
    const nextIdx = (currentIdx + 1) % humorClips.length
    handleSelectClip(humorClips[nextIdx])
  }, [selectedClip, handleSelectClip])

  // ------- Render locked state -------
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 pb-20 md:pb-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <Card padding="lg" className="text-center">
              {/* Lock icon */}
              <div className="w-20 h-20 rounded-full bg-black/[0.03] border border-black/10 flex items-center justify-center mx-auto mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground/30"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <h1 className="text-xl font-display font-bold text-foreground mb-2">
                {uiLanguage === 'en' ? 'Humor Lab' : 'ユーモアラボ'}
              </h1>
              <p className="text-sm text-foreground/50 mb-5">
                {uiLanguage === 'en'
                  ? 'Complete 10 lessons to unlock the Humor Lab'
                  : 'ユーモアラボを解除するには10レッスンを完了してください'}
              </p>

              <ProgressBar
                value={(lessonsCompleted.length / 10) * 100}
                color="#1B4F8A"
              />

              <Link href="/dashboard">
                <Button variant="secondary" fullWidth>
                  {uiLanguage === 'en' ? 'Back to Dashboard' : 'ダッシュボードに戻る'}
                </Button>
              </Link>
            </Card>
          </motion.div>
        </main>
        <MobileNav />
      </div>
    )
  }

  // ------- Render unlocked state -------
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 pb-24 md:pb-8">
        {/* Header with Humor IQ */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-accent text-glow mb-1">
              {uiLanguage === 'en' ? 'Humor Lab' : 'ユーモアラボ'}
            </h1>
            <p className="text-foreground/40 text-sm">
              {uiLanguage === 'en'
                ? '"Why Is This Funny?" decoder'
                : '「なぜ面白い？」デコーダー'}
            </p>
          </div>
          <div className="glass-card px-4 py-2.5 flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="brain">
              🧠
            </span>
            <div>
              <p className="text-xs text-foreground/40">
                {uiLanguage === 'en' ? 'Humor IQ' : 'ユーモアIQ'}
              </p>
              <p className="text-lg font-bold text-accent tabular-nums">{humorIQ}</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ===== Clip detail view ===== */}
          {selectedClip ? (
            <motion.div
              key={`clip-${selectedClip.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {/* Back button */}
              <button
                onClick={() => setSelectedClip(null)}
                className="flex items-center gap-1.5 text-sm text-foreground/40 hover:text-foreground/70 transition-colors mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                {uiLanguage === 'en' ? 'Back to clips' : 'クリップ一覧に戻る'}
              </button>

              {/* Clip title and badge */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {uiLanguage === 'en' ? selectedClip.title : selectedClip.titleJP}
                </h2>
                <Badge color={categoryColors[selectedClip.category]} size="sm">
                  {selectedClip.category}
                </Badge>
              </div>

              {/* YouTube embed */}
              <Card padding="none" className="mb-5 overflow-hidden">
                <div className="youtube-container">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedClip.youtubeId}?rel=0`}
                    title={selectedClip.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => {
                      // Mark as watched after iframe loads (user can interact)
                      setTimeout(() => setHasWatched(true), 3000)
                    }}
                  />
                </div>
              </Card>

              {/* Rating buttons (appear after watching) */}
              {hasWatched && !rating && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <p className="text-sm text-foreground/50 text-center mb-4">
                    {uiLanguage === 'en' ? 'How well did you understand the humor?' : 'ユーモアはどの程度理解できましたか？'}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => handleRate('got-it')}
                      className="!border-green-500/30 hover:!bg-green-500/10 hover:!border-green-500/50"
                    >
                      <span className="flex flex-col items-center gap-1">
                        <span className="text-lg">😄</span>
                        <span className="text-xs">{uiLanguage === 'en' ? 'I got it' : '分かった'}</span>
                      </span>
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => handleRate('kind-of')}
                      className="!border-yellow-500/30 hover:!bg-yellow-500/10 hover:!border-yellow-500/50"
                    >
                      <span className="flex flex-col items-center gap-1">
                        <span className="text-lg">🤔</span>
                        <span className="text-xs">{uiLanguage === 'en' ? 'Kind of' : 'まあまあ'}</span>
                      </span>
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => handleRate('didnt-get-it')}
                      className="!border-red-500/30 hover:!bg-red-500/10 hover:!border-red-500/50"
                    >
                      <span className="flex flex-col items-center gap-1">
                        <span className="text-lg">😅</span>
                        <span className="text-xs">{uiLanguage === 'en' ? "Didn't get it" : '分からない'}</span>
                      </span>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Watch prompt */}
              {!hasWatched && !rating && (
                <div className="text-center py-4">
                  <p className="text-sm text-foreground/30 italic">
                    {uiLanguage === 'en'
                      ? 'Watch the clip first, then rate your understanding...'
                      : 'まずクリップを見てから、理解度を評価してください...'}
                  </p>
                </div>
              )}

              {/* Congratulations (got it) */}
              {showCongrats && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card padding="lg" className="text-center mb-5">
                    <span className="text-4xl block mb-3">🎉</span>
                    <h3 className="text-lg font-bold text-accent mb-2">
                      {uiLanguage === 'en' ? 'You got it!' : '正解！'}
                    </h3>
                    <p className="text-sm text-foreground/50 mb-1">
                      {uiLanguage === 'en' ? '+10 Humor IQ' : '+10 ユーモアIQ'}
                    </p>
                    <p className="text-xs text-foreground/30">
                      {uiLanguage === 'en'
                        ? 'Great cultural instincts!'
                        : '素晴らしい文化的センスです！'}
                    </p>
                  </Card>
                  <div className="text-center">
                    <Button onClick={handleNextClip}>
                      {uiLanguage === 'en' ? 'Next Clip' : '次のクリップ'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* AI Analysis (kind of / didn't get it) */}
              {(rating === 'kind-of' || rating === 'didnt-get-it') && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {isAnalyzing && !analysis && (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center gap-3 glass-card px-5 py-3">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm text-foreground/50">
                          {uiLanguage === 'en' ? 'Analyzing the humor...' : 'ユーモアを分析中...'}
                        </span>
                      </div>
                    </div>
                  )}

                  {analysis && (
                    <Card padding="lg" className="mb-5">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">🔍</span>
                        <h3 className="text-base font-semibold text-accent">
                          {uiLanguage === 'en' ? 'Humor Decoded' : 'ユーモア解読'}
                        </h3>
                        <Badge color="blue" size="sm">
                          +5 IQ
                        </Badge>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        {analysis.split('\n').map((line, i) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return (
                              <h4 key={i} className="text-sm font-semibold text-accent/80 mt-4 mb-2">
                                {line.replace(/\*\*/g, '')}
                              </h4>
                            )
                          }
                          if (line.match(/^\d+\./)) {
                            return (
                              <p key={i} className="text-sm text-foreground/60 ml-4 mb-1">
                                {line}
                              </p>
                            )
                          }
                          if (line.trim() === '') return <div key={i} className="h-2" />
                          return (
                            <p key={i} className="text-sm text-foreground/70 leading-relaxed mb-1">
                              {line}
                            </p>
                          )
                        })}
                      </div>
                    </Card>
                  )}

                  {analysis && !isAnalyzing && (
                    <div className="text-center">
                      <Button onClick={handleNextClip}>
                        {uiLanguage === 'en' ? 'Next Clip' : '次のクリップ'}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* ===== Clip grid view ===== */
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {humorClips.map((clip, i) => (
                  <motion.button
                    key={clip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.06 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectClip(clip)}
                    className="glass-card overflow-hidden text-left cursor-pointer group transition-shadow duration-300 hover:shadow-[0_0_24px_rgba(27,79,138,0.15)]"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-black/[0.03]">
                      <Image
                        src={`https://img.youtube.com/vi/${clip.youtubeId}/mqdefault.jpg`}
                        alt={clip.title}
                        fill
                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        loading="lazy"
                      />
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-black/20 group-hover:scale-110 transition-transform">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-foreground ml-0.5"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">
                          {uiLanguage === 'en' ? clip.title : clip.titleJP}
                        </h3>
                      </div>
                      <Badge color={categoryColors[clip.category]} size="sm">
                        {clip.category}
                      </Badge>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MobileNav />
    </div>
  )
}
