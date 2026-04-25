'use client'

import { useMemo, type CSSProperties } from 'react'
import { segmentDialogueText, type DialogueSegment } from '@/lib/dialogue-highlighter'

interface Props {
  text: string
  lessonKana: string[]
  learnedKana: string[]
  seenKana: string[]
  newPhrases: string[]
  fontSize?: string
  fontWeight?: number
  lineHeight?: string
  className?: string
}

export function HighlightedJapanese({
  text,
  lessonKana,
  learnedKana,
  seenKana,
  newPhrases,
  fontSize = '17px',
  fontWeight = 400,
  lineHeight = '2.0',
  className = '',
}: Props) {
  const segments = useMemo(
    () =>
      segmentDialogueText(text, { lessonKana, learnedKana, seenKana, newPhrases }),
    [text, lessonKana, learnedKana, seenKana, newPhrases],
  )

  return (
    <span
      className={className}
      style={{
        fontFamily: 'Noto Sans JP',
        fontSize,
        fontWeight,
        lineHeight,
        textDecoration: 'none',
      }}
    >
      {segments.map((seg, i) => (
        <SegmentSpan key={i} segment={seg} />
      ))}
    </span>
  )
}

// ── Segment router ──────────────────────────────────────────────────

function SegmentSpan({ segment }: { segment: DialogueSegment }) {
  const hasGold = segment.newKanaChars.length > 0
  const hasGreen = segment.isPhrase
  const hasDict = segment.hasDictionary && !segment.isKanji

  if (hasGreen) {
    return (
      <PhraseSpan
        text={segment.text}
        newKanaChars={segment.newKanaChars}
        hasDict={hasDict}
      />
    )
  }

  if (hasGold || hasDict) {
    return <SingleCharSpan char={segment.text} hasGold={hasGold} hasDict={hasDict} />
  }

  return <span>{segment.text}</span>
}

// ── Phrase span ──────────────────────────────────────────────────────
// Green underline via background-image gradient (pixel-perfect).
// Gold bōten dots on individual new kana inside the phrase.
// Dictionary dotted pushed below the green line.

function PhraseSpan({
  text,
  newKanaChars,
  hasDict,
}: {
  text: string
  newKanaChars: string[]
  hasDict: boolean
}) {
  const goldSet = new Set(newKanaChars)

  const style: CSSProperties = {
    // Green smooth line via background gradient
    backgroundImage: 'linear-gradient(#2D9E6B, #2D9E6B)',
    backgroundSize: '100% 1.5px',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'bottom 0px left 0px',
    paddingBottom: '8px',
    // Dictionary dotted below the green line
    ...(hasDict
      ? {
          textDecoration: 'underline',
          textDecorationStyle: 'dotted' as const,
          textDecorationColor: 'rgba(158, 152, 146, 0.6)',
          textDecorationThickness: '2px',
          textUnderlineOffset: '8px',
        }
      : {}),
  }

  return (
    <span style={style}>
      {Array.from(text).map((char, i) =>
        goldSet.has(char) ? (
          <span key={i} className="char-gold">
            {char}
          </span>
        ) : (
          <span key={i}>{char}</span>
        ),
      )}
    </span>
  )
}

// ── Single character span ───────────────────────────────────────────
// Gold bōten dots and/or dictionary dotted underline.

function SingleCharSpan({
  char,
  hasGold,
  hasDict,
}: {
  char: string
  hasGold: boolean
  hasDict: boolean
}) {
  const style: CSSProperties = {
    ...(hasDict
      ? {
          textDecoration: 'underline',
          textDecorationStyle: 'dotted' as const,
          textDecorationColor: 'rgba(158, 152, 146, 0.6)',
          textDecorationThickness: '2px',
          textUnderlineOffset: '6px',
        }
      : {}),
  }

  if (hasGold) {
    return (
      <span style={style} className="char-gold">
        {char}
      </span>
    )
  }

  return <span style={style}>{char}</span>
}

export default HighlightedJapanese
