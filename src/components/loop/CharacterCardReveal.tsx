'use client'

import { useState, useEffect } from 'react'

interface RevealCard {
  character: string
  romaji?: string
  english?: string
  type: 'kana' | 'phrase'
}

interface Props {
  lessonKana: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lessonPhrases?: any[]
  onContinue: () => void
}

const KANA_ROMAJI: Record<string, string> = {
  'あ':'a','い':'i','う':'u','え':'e','お':'o',
  'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
  'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
  'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
  'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
  'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
  'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
  'や':'ya','ゆ':'yu','よ':'yo',
  'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
  'わ':'wa','を':'wo','ん':'n',
  'ア':'a','イ':'i','ウ':'u','エ':'e','オ':'o',
  'カ':'ka','キ':'ki','ク':'ku','ケ':'ke','コ':'ko',
  'サ':'sa','シ':'shi','ス':'su','セ':'se','ソ':'so',
  'タ':'ta','チ':'chi','ツ':'tsu','テ':'te','ト':'to',
  'ナ':'na','ニ':'ni','ヌ':'nu','ネ':'ne','ノ':'no',
  'ハ':'ha','ヒ':'hi','フ':'fu','ヘ':'he','ホ':'ho',
  'マ':'ma','ミ':'mi','ム':'mu','メ':'me','モ':'mo',
  'ヤ':'ya','ユ':'yu','ヨ':'yo',
  'ラ':'ra','リ':'ri','ル':'ru','レ':'re','ロ':'ro',
  'ワ':'wa','ヲ':'wo','ン':'n',
}

export default function CharacterCardReveal({
  lessonKana,
  lessonPhrases = [],
  onContinue,
}: Props) {
  const allCards: RevealCard[] = [
    ...lessonKana.map((k) => ({
      character: k,
      romaji: KANA_ROMAJI[k] || '',
      type: 'kana' as const,
    })),
    ...lessonPhrases.slice(0, 2).map((p) => ({
      character: p.word || p.character || '',
      romaji: p.romaji || '',
      english: p.english || '',
      type: 'phrase' as const,
    })),
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showSticker, setShowSticker] = useState(false)
  const [showContinue, setShowContinue] = useState(false)
  const [allRevealed, setAllRevealed] = useState(false)

  useEffect(() => {
    if (allCards.length === 0) {
      setShowContinue(true)
      return
    }
    const t = setTimeout(() => startFlip(), 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (currentIndex > 0 && currentIndex < allCards.length) {
      setIsFlipped(false)
      setIsFlipping(false)
      setShowSticker(false)
      const t = setTimeout(() => startFlip(), 500)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  const startFlip = () => {
    setIsFlipping(true)
    setTimeout(() => setIsFlipped(true), 300)
    setTimeout(() => {
      setIsFlipping(false)
      setTimeout(() => setShowSticker(true), 200)
      setTimeout(() => {
        if (currentIndex < allCards.length - 1) {
          setCurrentIndex((i) => i + 1)
        } else {
          setAllRevealed(true)
          setTimeout(() => setShowContinue(true), 400)
        }
      }, 1800)
    }, 600)
  }

  if (allCards.length === 0 && showContinue) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center px-6 space-y-6 z-50"
        style={{ backgroundColor: '#F5F0EB' }}
      >
        <p style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '22px', color: '#1A1814' }}>
          Your lesson is ready
        </p>
        <button
          onClick={onContinue}
          className="w-full max-w-xs py-4 rounded-[10px] bg-[#1B4F8A] text-white text-sm font-medium hover:bg-[#4A7AB5] active:translate-y-px transition-all"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Start lesson
        </button>
      </div>
    )
  }

  const card = allCards[currentIndex]
  if (!card) return null

  const isKana = card.type === 'kana'
  const borderColor = isKana ? '#D4AF37' : '#3D8B5E'
  const frontColor = isKana ? '#B8860B' : '#2D6A4F'
  const frontBg = isKana ? 'rgba(212,175,55,0.1)' : 'rgba(45,106,79,0.1)'
  const stickerBg = isKana ? '#D4AF37' : '#3D8B5E'

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6 space-y-8 z-50"
      style={{ backgroundColor: '#F5F0EB' }}
    >
      {/* Header */}
      <div className="text-center space-y-1">
        <p
          className="text-[10px] tracking-widest uppercase text-[#9E9892] font-medium"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {currentIndex + 1} of {allCards.length}
        </p>
        <p style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '20px', color: '#1A1814' }}>
          {allRevealed ? 'Your lesson is ready' : 'New discovery'}
        </p>
      </div>

      {/* Card with 3D flip */}
      <div style={{ perspective: '800px', width: '200px', height: '260px' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: isFlipping
              ? isFlipped ? 'rotateY(0deg)' : 'rotateY(-90deg)'
              : isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
            transition: isFlipping ? 'transform 0.3s ease-in-out' : 'none',
          }}
        >
          {/* BACK — dark */}
          <div
            className="absolute inset-0 rounded-[16px] flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              backgroundColor: '#2C2924',
              border: '2px solid #1A1814',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}
          >
            <p style={{ fontFamily: 'Noto Sans JP', fontSize: '64px', color: 'rgba(255,255,255,0.06)', fontWeight: 300 }}>
              ?
            </p>
          </div>

          {/* FRONT — gold or green */}
          <div
            className="absolute inset-0 rounded-[16px] flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              backgroundColor: '#FDFBF8',
              border: `2px solid ${borderColor}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px ${borderColor}40`,
            }}
          >
            {/* Top color bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[14px]"
              style={{ backgroundColor: borderColor }}
            />

            {/* NEW sticker */}
            {showSticker && (
              <div className="absolute -top-3 -right-3 z-10" style={{ animation: 'stickerSlap 0.35s cubic-bezier(0.34,1.8,0.64,1) forwards' }}>
                <div
                  className="px-2.5 py-1 rounded-[6px] text-xs tracking-widest shadow-lg"
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 900,
                    backgroundColor: stickerBg,
                    color: 'white',
                    transform: 'rotate(12deg)',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  NEW
                </div>
              </div>
            )}

            {/* Character */}
            <p style={{
              fontFamily: 'Noto Sans JP',
              fontSize: isKana ? '80px' : '28px',
              color: frontColor,
              fontWeight: isKana ? 300 : 400,
              lineHeight: 1,
              textAlign: 'center',
              padding: isKana ? '0' : '0 16px',
            }}>
              {card.character}
            </p>

            {card.romaji && (
              <p className="mt-3" style={{ fontFamily: 'DM Mono, monospace', fontSize: '18px', color: frontColor, opacity: 0.7 }}>
                {card.romaji}
              </p>
            )}

            {card.english && (
              <p className="mt-1 px-4 text-center" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#6B6560' }}>
                {card.english}
              </p>
            )}

            {/* Type badge */}
            <div className="absolute bottom-4 px-3 py-1 rounded-full" style={{ backgroundColor: frontBg }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', color: frontColor, fontWeight: 600, letterSpacing: '0.05em' }}>
                {isKana ? 'HIRAGANA' : 'PHRASE'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {allCards.map((c, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === currentIndex ? '20px' : '6px',
              height: '6px',
              backgroundColor: i < currentIndex
                ? '#3D6B4F'
                : i === currentIndex
                  ? (c.type === 'kana' ? '#D4AF37' : '#3D8B5E')
                  : '#E0DAD2',
            }}
          />
        ))}
      </div>

      {/* Continue button */}
      {showContinue && (
        <button
          onClick={onContinue}
          className="w-full max-w-xs py-4 rounded-[10px] bg-[#1B4F8A] text-white text-sm font-medium hover:bg-[#4A7AB5] active:translate-y-px transition-all ink-in"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Start lesson
        </button>
      )}
    </div>
  )
}
