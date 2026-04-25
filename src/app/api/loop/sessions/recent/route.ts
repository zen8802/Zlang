import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionRow = any

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ sessions: [] })
  }

  const { userId } = auth()
  if (!userId) return NextResponse.json({ sessions: [] })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const sessions = (await sql`
    SELECT
      id,
      scenario_id,
      scenario_title,
      character_name,
      current_phase,
      status,
      loop_mode,
      last_active_at,
      created_at,
      is_abandoned,
      is_saved,
      jsonb_array_length(
        COALESCE(attempt_messages, '[]'::jsonb)
      ) AS message_count
    FROM loop_sessions
    WHERE (user_id = ${userId} OR user_id IS NULL)
      AND is_abandoned = false
    ORDER BY last_active_at DESC
    LIMIT 20
  `) as SessionRow[]

  return NextResponse.json({ sessions })
}
