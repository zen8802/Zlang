import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

interface LearnedWord {
  word: string
  english: string
  pos: string
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ sessions: [] })
  }

  const { userId } = auth()
  if (!userId) return NextResponse.json({ sessions: [] })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions = await sql`
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
      COALESCE(is_favorite, false) AS is_favorite,
      jsonb_array_length(
        COALESCE(attempt_messages, '[]'::jsonb)
      ) AS message_count,
      learn_blocks
    FROM loop_sessions
    WHERE (user_id = ${userId} OR user_id IS NULL)
      AND is_abandoned = false
    ORDER BY last_active_at DESC
    LIMIT 20
  `

  // Extract learned words from flashcard blocks in learn_blocks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = sessions.map((s: any) => {
    const learnedWords: LearnedWord[] = []

    if (s.status === 'complete' && s.learn_blocks) {
      const blocks = typeof s.learn_blocks === 'string'
        ? JSON.parse(s.learn_blocks)
        : s.learn_blocks

      if (Array.isArray(blocks)) {
        for (const block of blocks) {
          // Flashcard blocks have cards with word, english, partOfSpeech
          if (block.type === 'flashcard' && Array.isArray(block.cards)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const card of block.cards as any[]) {
              learnedWords.push({
                word: card.word || '',
                english: card.english || '',
                pos: card.partOfSpeech || 'noun',
              })
            }
          }
        }
      }
    }

    // Don't send the full blocks blob back
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { learn_blocks, ...rest } = s
    return { ...rest, learned_words: learnedWords }
  })

  return NextResponse.json({ sessions: result })
}
