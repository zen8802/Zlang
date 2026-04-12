import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScenarioRow = any

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ scenarios: [] })
  }

  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ scenarios: [] })
  }

  const sql = neon(process.env.DATABASE_URL)

  const scenarios = (await sql`
    SELECT
      id,
      title,
      user_description AS "userDescription",
      times_played AS "timesPlayed",
      created_at AS "createdAt",
      last_played_at AS "lastPlayedAt"
    FROM custom_scenarios
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 10
  `) as ScenarioRow[]

  return NextResponse.json({ scenarios })
}
