import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ entries: [] })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const rows = await sql`
    SELECT id, save_type, japanese, reading, romaji, english,
           part_of_speech, english_alts, example_jp, example_romaji, example_en,
           jlpt_level,
           source_session_id, source_scenario_title, source_character_name,
           user_note, created_at
    FROM phrasebook
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 200
  `

  return NextResponse.json({ entries: rows })
}

export async function POST(request: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No DB' }, { status: 500 })
  }

  const body = await request.json()

  if (!body.japanese) {
    return NextResponse.json({ error: 'japanese is required' }, { status: 400 })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const rows = await sql`
    INSERT INTO phrasebook (
      user_id, save_type, japanese, reading, romaji, english,
      part_of_speech, english_alts, example_jp, example_romaji, example_en,
      jlpt_level,
      source_session_id, source_scenario_title, source_character_name,
      user_note
    ) VALUES (
      ${userId},
      ${body.saveType || 'word'},
      ${body.japanese},
      ${body.reading || ''},
      ${body.romaji || ''},
      ${body.english || ''},
      ${body.partOfSpeech || null},
      ${body.englishAlts || []},
      ${body.exampleJP || null},
      ${body.exampleRomaji || null},
      ${body.exampleEN || null},
      ${body.jlptLevel || null},
      ${body.sourceSessionId || null},
      ${body.sourceScenarioTitle || null},
      ${body.sourceCharacterName || null},
      ${body.userNote || null}
    )
    ON CONFLICT (user_id, japanese) DO NOTHING
    RETURNING id, created_at
  `

  return NextResponse.json({ id: rows[0]?.id, created_at: rows[0]?.created_at })
}
