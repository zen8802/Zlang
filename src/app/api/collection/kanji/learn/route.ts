import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/collection/kanji/learn
 *
 * The single source of truth for marking a kanji as LEARNED (gold).
 * Called only after the user completes the trace + write + speak sequence
 * in /collection/kanji/learn/[character].
 *
 * Adds the character to `users.discovered_kanji` and removes it from
 * `users.seen_kanji` (since "learned" supersedes "seen").
 */
export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { character } = await req.json()
  if (!character || typeof character !== 'string') {
    return NextResponse.json({ error: 'character is required' }, { status: 400 })
  }

  if (!process.env.DATABASE_URL) {
    // Persistence not configured — succeed so client-side store updates.
    return NextResponse.json({ learned: true, persisted: false })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  await sql`
    UPDATE users SET
      discovered_kanji = (
        SELECT array_agg(DISTINCT elem)
        FROM unnest(
          array_cat(
            COALESCE(discovered_kanji, '{}'),
            ARRAY[${character}]::text[]
          )
        ) AS elem
      ),
      seen_kanji = (
        SELECT COALESCE(array_agg(elem), '{}')
        FROM unnest(COALESCE(seen_kanji, '{}')) AS elem
        WHERE elem != ${character}
      )
    WHERE clerk_id = ${userId}
  `

  return NextResponse.json({ learned: true, persisted: true })
}
