import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

interface DomainTotalRow {
  domain: string
  total: string
}
interface DomainCollectedRow {
  domain: string
  collected: string
  mastered: string
}
interface TotalRow {
  total: string
}
interface CountRow {
  collected: string
  mastered: string
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ domains: [], total: { collected: 0, total: 0, mastered: 0 } })
  }

  const { userId } = auth()
  const effectiveUserId = userId || 'guest'

  const sql = neon(process.env.DATABASE_URL)

  // Total card count per domain
  const domainTotals = (await sql`
    SELECT domain, COUNT(*) AS total
    FROM vocabulary_cards
    GROUP BY domain
  `) as DomainTotalRow[]

  // User's collected count per domain
  const domainCollected = (await sql`
    SELECT vc.domain,
           COUNT(*) AS collected,
           COUNT(*) FILTER (WHERE uc.status = 'mastered') AS mastered
    FROM user_cards uc
    JOIN vocabulary_cards vc ON vc.id = uc.card_id
    WHERE uc.user_id = ${effectiveUserId}
    GROUP BY vc.domain
  `) as DomainCollectedRow[]

  const collectedMap = new Map<string, { collected: number; mastered: number }>()
  for (const row of domainCollected) {
    collectedMap.set(row.domain, {
      collected: parseInt(row.collected, 10),
      mastered: parseInt(row.mastered, 10),
    })
  }

  const domains = domainTotals.map((row) => {
    const c = collectedMap.get(row.domain) || { collected: 0, mastered: 0 }
    return {
      domain: row.domain,
      total: parseInt(row.total, 10),
      collected: c.collected,
      mastered: c.mastered,
    }
  })

  // Overall totals (using the fixed 2000-card target from the spec)
  const [{ total: totalCardsStr }] = (await sql`
    SELECT COUNT(*) AS total FROM vocabulary_cards
  `) as TotalRow[]

  const [counts] = (await sql`
    SELECT
      COUNT(*) AS collected,
      COUNT(*) FILTER (WHERE status = 'mastered') AS mastered
    FROM user_cards
    WHERE user_id = ${effectiveUserId}
  `) as CountRow[]

  return NextResponse.json({
    domains,
    total: {
      collected: parseInt(counts?.collected || '0', 10),
      total: 2000, // long-term target
      seeded: parseInt(totalCardsStr, 10), // currently seeded
      mastered: parseInt(counts?.mastered || '0', 10),
    },
  })
}
