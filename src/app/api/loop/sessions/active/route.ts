import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionRow = any

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ session: null })
  }

  const { userId } = auth()
  if (!userId) return NextResponse.json({ session: null })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const rows = (await sql`
    SELECT
      id,
      scenario_title AS "scenarioTitle",
      scenario_emoji AS "scenarioEmoji",
      character_name AS "characterName",
      current_phase AS "currentPhase",
      current_block_index AS "currentBlockIndex",
      completed_block_ids AS "completedBlockIds",
      last_active_at AS "lastActiveAt",
      loop_mode AS "loopMode",
      jsonb_array_length(COALESCE(attempt_messages, '[]'::jsonb)) AS "messageCount"
    FROM loop_sessions
    WHERE (user_id = ${userId} OR user_id IS NULL)
      AND phase != 'complete'
      AND is_abandoned = false
      AND last_active_at > NOW() - INTERVAL '7 days'
    ORDER BY last_active_at DESC
    LIMIT 1
  `) as SessionRow[]

  return NextResponse.json({ session: rows[0] || null })
}
