import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const ADMIN_CLERK_ID = process.env.ADMIN_CLERK_ID || ''

/**
 * Wipes all per-user learning state — kanji collection, learned words,
 * phrasebook, lessons, sessions, milestones, custom scenarios, etc. Leaves
 * the user's auth account intact but otherwise returns them to a brand-new
 * state.
 *
 * Each delete is wrapped in its own try so a missing table or schema drift
 * doesn't abort the whole reset.
 */
export async function POST() {
  const { userId } = auth()
  if (!userId || !ADMIN_CLERK_ID || userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No DB' }, { status: 500 })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const wiped: string[] = []
  const failed: { table: string; error: string }[] = []

  // Every per-user data table. Each wipes WHERE user_id = ${userId}.
  const tables = [
    'learned_words',
    'user_cards',
    'phrasebook',
    'lesson_progress',
    'saved_lessons',
    'studio_sessions',
    'loop_sessions',
    'user_milestones',
    'user_flags',
    'user_vocabulary',
    'custom_scenarios',
    'abuse_log',
  ]

  for (const table of tables) {
    try {
      // neon requires sql.unsafe for dynamic identifiers; we whitelist above
      // so this isn't user input.
      await sql.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId])
      wiped.push(table)
    } catch (err) {
      failed.push({
        table,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // Reset the users row itself — kanji collection + level back to zero.
  try {
    await sql`
      UPDATE users SET
        discovered_kanji = '{}',
        seen_kanji = '{}',
        kanji_level = 1
      WHERE clerk_id = ${userId}
    `
    wiped.push('users.kanji_state')
  } catch (err) {
    failed.push({
      table: 'users',
      error: err instanceof Error ? err.message : String(err),
    })
  }

  return NextResponse.json({ reset: true, wiped, failed })
}
