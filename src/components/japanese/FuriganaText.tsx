'use client'

import type { ReactNode } from 'react'

interface Props {
  text: string
  rtSize?: string
  rtColor?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Render Japanese text that may contain inline furigana annotations of the
 * form `漢字(かんじ)` as proper <ruby> elements. Anything outside the
 * annotation pattern is rendered as-is.
 */
export function renderFurigana(text: string, rtSize = '0.55em', rtColor = '#9E9892'): ReactNode {
  if (!text) return null
  const regex = /([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g
  const parts: ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    parts.push(
      <ruby key={match.index}>
        {match[1]}
        <rp>(</rp>
        <rt style={{ fontSize: rtSize, fontWeight: 400, color: rtColor, letterSpacing: '0.05em' }}>
          {match[2]}
        </rt>
        <rp>)</rp>
      </ruby>,
    )
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length > 0 ? <>{parts}</> : text
}

export function FuriganaText({ text, rtSize, rtColor, className, style }: Props) {
  return (
    <span className={className} style={style}>
      {renderFurigana(text, rtSize, rtColor)}
    </span>
  )
}
