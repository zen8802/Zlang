import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

interface GapRow {
  domain: string
  total_in_domain: string
  user_has: string
  coverage_percent: string
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ gaps: [] })
  }

  const { userId } = auth()
  const effectiveUserId = userId || 'guest'

  const sql = neon(process.env.DATABASE_URL)

  const rows = (await sql`
    SELECT
      vc.domain,
      COUNT(vc.id) AS total_in_domain,
      COUNT(uc.id) AS user_has,
      ROUND(
        COUNT(uc.id)::numeric / NULLIF(COUNT(vc.id), 0) * 100
      ) AS coverage_percent
    FROM vocabulary_cards vc
    LEFT JOIN user_cards uc
      ON uc.card_id = vc.id
      AND uc.user_id = ${effectiveUserId}
    GROUP BY vc.domain
    HAVING COUNT(vc.id) > 0
    ORDER BY coverage_percent ASC NULLS FIRST
  `) as GapRow[]

  // Three biggest gaps — these become "fill this gap" suggestions
  const gaps = rows.slice(0, 3).map((r) => ({
    domain: r.domain,
    totalInDomain: parseInt(r.total_in_domain, 10),
    userHas: parseInt(r.user_has, 10),
    coveragePercent: parseInt(r.coverage_percent || '0', 10),
  }))

  return NextResponse.json({ gaps })
}
