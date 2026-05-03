import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ words: [] })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const rows = await sql`
    SELECT id, japanese, reading, romaji, english,
           part_of_speech, example_jp, example_romaji, example_en,
           jlpt_level, source_session_id, source_scenario_title,
           learned_at
    FROM learned_words
    WHERE user_id = ${userId}
    ORDER BY learned_at DESC
    LIMIT 500
  `

  return NextResponse.json({ words: rows })
}

// Batch save learned words when a lesson completes
export async function POST(request: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB' }, { status: 500 })

  const { words, sessionId, scenarioTitle } = await request.json()
  if (!words || !Array.isArray(words) || words.length === 0) {
    return NextResponse.json({ saved: 0 })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  let saved = 0
  for (const w of words) {
    if (!w.word) continue
    try {
      await sql`
        INSERT INTO learned_words (
          user_id, japanese, reading, romaji, english,
          part_of_speech, example_jp, example_romaji, example_en,
          source_session_id, source_scenario_title
        ) VALUES (
          ${userId},
          ${w.word},
          ${w.reading || ''},
          ${w.romaji || ''},
          ${w.english || ''},
          ${w.partOfSpeech || null},
          ${w.exampleJP || null},
          ${w.exampleRomaji || null},
          ${w.exampleEN || null},
          ${sessionId || null},
          ${scenarioTitle || null}
        )
        ON CONFLICT (user_id, japanese) DO NOTHING
      `
      saved++
    } catch {
      // skip duplicates
    }
  }

  return NextResponse.json({ saved })
}
