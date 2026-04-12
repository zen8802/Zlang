import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

interface CountRow {
  collected: string
  mastered: string
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecentCardRow = any

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      collected: 0,
      total: 2000,
      mastered: 0,
      recentCards: [],
    })
  }

  const { userId } = auth()
  const effectiveUserId = userId || 'guest'

  const sql = neon(process.env.DATABASE_URL)

  const [counts] = (await sql`
    SELECT
      COUNT(*) AS collected,
      COUNT(*) FILTER (WHERE status = 'mastered') AS mastered
    FROM user_cards
    WHERE user_id = ${effectiveUserId}
  `) as CountRow[]

  const recentCards = (await sql`
    SELECT vc.id, vc.word, vc.reading, vc.romaji, vc.english,
           vc.card_color AS "cardColor", vc.card_emoji AS "cardEmoji",
           vc.rarity, vc.domain
    FROM user_cards uc
    JOIN vocabulary_cards vc ON vc.id = uc.card_id
    WHERE uc.user_id = ${effectiveUserId}
    ORDER BY uc.last_seen_at DESC
    LIMIT 3
  `) as RecentCardRow[]

  return NextResponse.json({
    collected: parseInt(counts?.collected || '0', 10),
    total: 2000,
    mastered: parseInt(counts?.mastered || '0', 10),
    recentCards,
  })
}
