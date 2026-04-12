'use client'

import { useState } from 'react'

type CardStatus = 'hidden' | 'heard' | 'unlocked' | 'strengthening' | 'mastered'
type CardSize = 'sm' | 'md' | 'lg'

interface CardData {
  id: string
  word: string
  reading: string
  romaji: string
  english: string
  jlptLevel: string
  frequencyRank: number
  domain: string
  rarity: 'common' | 'uncommon' | 'rare' | 'ultra_rare'
  partOfSpeech: string
  exampleJP: string
  exampleReading: string
  exampleEN: string
  cardColor: string
  cardEmoji: string
}

interface UserCardData {
  status: CardStatus
  encounterCount: number
  productionCount: number
  firstEncounteredAt: string
  masteredAt?: string
  contexts: { scenarioId: string; domain: string }[]
}

interface Props {
  card: CardData
  userCard?: UserCardData | null
  size?: CardSize
  onClick?: () => void
  showBack?: boolean
  isNew?: boolean
}

const RARITY_STYLES: Record<
  CardData['rarity'],
  { border: string; glow: string; label: string; labelBg: string; labelColor: string }
> = {
  common: {
    border: '#B8B0A4',
    glow: 'rgba(184, 176, 164, 0.5)',
    label: 'Common',
    labelBg: '#E8E3DA',
    labelColor: '#6B6459',
  },
  uncommon: {
    border: '#4A9D7F',
    glow: 'rgba(74, 157, 127, 0.5)',
    label: 'Uncommon',
    labelBg: '#DCEFE6',
    labelColor: '#2C6B54',
  },
  rare: {
    border: '#4A7AB5',
    glow: 'rgba(74, 122, 181, 0.6)',
    label: 'Rare',
    labelBg: '#DCE7F5',
    labelColor: '#1B4F8A',
  },
  ultra_rare: {
    border: '#C9A961',
    glow: 'rgba(201, 169, 97, 0.7)',
    label: 'Ultra Rare',
    labelBg: '#FBF3DF',
    labelColor: '#8A6D2C',
  },
}

const SIZE_DIMS: Record<CardSize, { w: number; h: number }> = {
  sm: { w: 120, h: 168 },
  md: { w: 180, h: 252 },
  lg: { w: 240, h: 336 },
}

export function VocabularyCard({
  card,
  userCard = null,
  size = 'md',
  onClick,
  showBack = false,
  isNew = false,
}: Props) {
  const [flipped, setFlipped] = useState(showBack)

  const dims = SIZE_DIMS[size]
  const rarity = RARITY_STYLES[card.rarity]
  const isLocked = !userCard || userCard.status === 'hidden'
  const isMastered = userCard?.status === 'mastered'
  const encounterCount = userCard?.encounterCount ?? 0
  const masteryPct = Math.min(100, (encounterCount / 5) * 100)

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }
    if (!isLocked) {
      setFlipped((f) => !f)
    }
  }

  const wordFontSize = size === 'sm' ? 18 : size === 'md' ? 26 : 34
  const emojiFontSize = size === 'sm' ? 32 : size === 'md' ? 48 : 64
  const englishFontSize = size === 'sm' ? 11 : size === 'md' ? 14 : 17
  const romajiFontSize = size === 'sm' ? 9 : size === 'md' ? 11 : 13
  const labelFontSize = size === 'sm' ? 7 : size === 'md' ? 9 : 11

  return (
    <div
      className={isNew ? 'ink-in' : ''}
      style={{
        width: dims.w,
        height: dims.h,
        perspective: '600px',
        cursor: 'pointer',
      }}
      onClick={handleClick}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: 12,
            border: `2px solid ${rarity.border}`,
            background: isLocked ? '#EFEAE1' : card.cardColor || '#FFFFFF',
            boxShadow: isMastered ? `0 0 24px 2px ${rarity.glow}` : '0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {isLocked ? (
            <>
              {/* Locked silhouette */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: emojiFontSize,
                  opacity: 0.3,
                  filter: 'grayscale(1)',
                }}
              >
                {card.cardEmoji}
              </div>
              <div style={{ padding: size === 'sm' ? 8 : 12 }}>
                <div
                  style={{
                    height: size === 'sm' ? 8 : 10,
                    background: '#D8D2C6',
                    borderRadius: 4,
                    marginBottom: 6,
                    width: '70%',
                  }}
                />
                <div
                  style={{
                    height: size === 'sm' ? 6 : 8,
                    background: '#D8D2C6',
                    borderRadius: 4,
                    width: '50%',
                  }}
                />
                <div
                  style={{
                    marginTop: 8,
                    fontSize: labelFontSize,
                    fontFamily: 'DM Sans, sans-serif',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#8A8478',
                  }}
                >
                  {card.domain} · {card.jlptLevel}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Emoji square top */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  background: 'rgba(255,255,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: emojiFontSize,
                  borderBottom: `1px solid ${rarity.border}40`,
                }}
              >
                {card.cardEmoji}
              </div>
              {/* Text content */}
              <div
                style={{
                  flex: 1,
                  padding: size === 'sm' ? 8 : 12,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: '"Noto Sans JP", sans-serif',
                      fontWeight: 500,
                      fontSize: wordFontSize,
                      color: '#1A1A1A',
                      lineHeight: 1.1,
                    }}
                  >
                    {card.word}
                  </div>
                  <div
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: romajiFontSize,
                      color: '#6B6459',
                      marginTop: 2,
                    }}
                  >
                    {card.romaji}
                  </div>
                  <div
                    style={{
                      fontFamily: '"Shippori Mincho", serif',
                      fontWeight: 600,
                      fontSize: englishFontSize,
                      color: '#2A2A2A',
                      marginTop: 4,
                      lineHeight: 1.2,
                    }}
                  >
                    {card.english}
                  </div>
                </div>
                <div>
                  {/* Mastery bar */}
                  <div
                    style={{
                      height: 4,
                      width: '100%',
                      background: 'rgba(0,0,0,0.08)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        width: `${masteryPct}%`,
                        height: '100%',
                        background: rarity.border,
                        transition: 'width 0.4s',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: labelFontSize,
                        fontFamily: 'DM Sans, sans-serif',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: rarity.labelColor,
                        background: rarity.labelBg,
                        padding: '2px 6px',
                        borderRadius: 3,
                      }}
                    >
                      {card.jlptLevel} · {card.partOfSpeech}
                    </span>
                    <span
                      style={{
                        fontSize: labelFontSize,
                        fontFamily: '"DM Mono", monospace',
                        color: '#6B6459',
                      }}
                    >
                      {isMastered ? 'Mastered' : `${encounterCount}/5`}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* BACK */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: 12,
            border: `2px solid ${rarity.border}`,
            background: '#1B4F8A',
            boxShadow: isMastered ? `0 0 24px 2px ${rarity.glow}` : '0 2px 8px rgba(0,0,0,0.08)',
            transform: 'rotateY(180deg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: size === 'sm' ? 8 : 12,
            color: 'white',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: '"Noto Sans JP", sans-serif',
                fontWeight: 300,
                fontSize: wordFontSize,
                color: 'white',
                lineHeight: 1.1,
              }}
            >
              {card.word}
            </div>
            <div
              style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: romajiFontSize,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 2,
              }}
            >
              {card.reading}
            </div>
          </div>

          {/* Example sentence card */}
          <div
            style={{
              marginTop: size === 'sm' ? 8 : 12,
              padding: size === 'sm' ? 6 : 10,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 6,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontFamily: '"Noto Sans JP", sans-serif',
                fontSize: size === 'sm' ? 10 : size === 'md' ? 12 : 15,
                color: 'white',
                lineHeight: 1.4,
              }}
            >
              {card.exampleJP}
            </div>
            <div
              style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: size === 'sm' ? 7 : size === 'md' ? 9 : 11,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 4,
                lineHeight: 1.3,
              }}
            >
              {card.exampleReading}
            </div>
            <div
              style={{
                fontFamily: '"Shippori Mincho", serif',
                fontStyle: 'italic',
                fontSize: size === 'sm' ? 8 : size === 'md' ? 10 : 12,
                color: 'rgba(255,255,255,0.7)',
                marginTop: 4,
                lineHeight: 1.3,
              }}
            >
              {card.exampleEN}
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: labelFontSize,
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
              marginTop: 6,
            }}
          >
            <span>Seen {userCard?.encounterCount ?? 0}</span>
            <span>Used {userCard?.productionCount ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VocabularyCard
