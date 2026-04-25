import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB' }, { status: 500 })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const { sessionId } = await req.json()

  const rows = (await sql`
    SELECT * FROM loop_sessions WHERE id = ${sessionId}
  `) as Row[]
  const session = rows[0]
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.is_saved) return NextResponse.json({ error: 'Already saved' }, { status: 400 })

  // Build vocabulary snapshot from user_cards encountered during this session
  const vocab = (await sql`
    SELECT
      vc.word, vc.reading, vc.romaji, vc.english,
      vc.part_of_speech AS "partOfSpeech",
      vc.jlpt_level AS "jlptLevel",
      vc.rarity,
      vc.card_emoji AS "cardEmoji",
      vc.card_color AS "cardColor",
      uc.production_count,
      uc.encounter_count AS "encounterCount"
    FROM user_cards uc
    JOIN vocabulary_cards vc ON vc.id = uc.card_id
    WHERE uc.user_id = ${userId}
      AND uc.first_encountered_at >= ${session.created_at}
    ORDER BY vc.frequency_rank ASC
  `) as Row[]

  // Extract unique kana + kanji from all messages
  const allMessages = [
    ...(session.attempt_messages || []),
    ...(session.retry_messages || []),
  ]
  const allText = allMessages.map((m: Row) => m.content || '').join('')

  const hiragana = new Set<string>()
  const katakana = new Set<string>()
  const kanji = new Set<string>()
  for (const char of allText) {
    const code = char.charCodeAt(0)
    if (code >= 0x3041 && code <= 0x3096) hiragana.add(char)
    if (code >= 0x30a0 && code <= 0x30ff) katakana.add(char)
    if (code >= 0x4e00 && code <= 0x9fff) kanji.add(char)
  }

  const id = `saved_${Date.now()}`
  await sql`
    INSERT INTO saved_lessons (
      id, user_id, session_id,
      scenario_title, character_name, scenario_id,
      loop_mode, user_experience_level,
      conversation_messages, learn_blocks, diagnosis,
      vocabulary_discovered,
      hiragana_discovered, katakana_discovered, kanji_discovered
    ) VALUES (
      ${id}, ${userId}, ${sessionId},
      ${session.scenario_title || 'Untitled'}, ${session.character_name || ''},
      ${session.scenario_id || ''},
      ${session.loop_mode || 'intermediate'}, ${session.user_experience_level || 3},
      ${JSON.stringify(session.attempt_messages || [])}::jsonb,
      ${JSON.stringify(session.learn_blocks || [])}::jsonb,
      ${JSON.stringify(session.diagnosis || {})}::jsonb,
      ${JSON.stringify(vocab)}::jsonb,
      ${Array.from(hiragana)}, ${Array.from(katakana)}, ${Array.from(kanji)}
    )
  `

  await sql`UPDATE loop_sessions SET is_saved = true WHERE id = ${sessionId}`

  return NextResponse.json({ savedLessonId: id })
}

export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ lessons: [] })
  if (!process.env.DATABASE_URL) return NextResponse.json({ lessons: [] })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const lessons = (await sql`
    SELECT
      id, scenario_title AS "scenarioTitle",
      character_name AS "characterName",
      scenario_id AS "scenarioId",
      loop_mode AS "loopMode",
      user_experience_level AS "userExperienceLevel",
      jsonb_array_length(COALESCE(vocabulary_discovered, '[]'::jsonb)) AS "vocabCount",
      array_length(hiragana_discovered, 1) AS "hiraganaCount",
      array_length(kanji_discovered, 1) AS "kanjiCount",
      jsonb_array_length(COALESCE(learn_blocks, '[]'::jsonb)) AS "blockCount",
      best_exam_score AS "bestExamScore",
      last_exam_score AS "lastExamScore",
      times_retaken AS "timesRetaken",
      saved_at AS "savedAt",
      last_studied_at AS "lastStudiedAt"
    FROM saved_lessons
    WHERE user_id = ${userId}
    ORDER BY saved_at DESC
  `) as Row[]

  return NextResponse.json({ lessons })
}
