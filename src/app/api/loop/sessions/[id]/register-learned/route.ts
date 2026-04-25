import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB' }, { status: 500 })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const { lessonKana } = await req.json()
  if (!Array.isArray(lessonKana) || lessonKana.length === 0) {
    return NextResponse.json({ registered: 0 })
  }

  const hiraganaToLearn = lessonKana.filter((c: string) => {
    const code = c.charCodeAt(0)
    return code >= 0x3041 && code <= 0x3096
  })
  const katakanaToLearn = lessonKana.filter((c: string) => {
    const code = c.charCodeAt(0)
    return code >= 0x30a0 && code <= 0x30ff
  })

  // Upsert into users table (create row if missing)
  await sql`
    INSERT INTO users (clerk_id) VALUES (${userId})
    ON CONFLICT (clerk_id) DO NOTHING
  `

  // Move from seen → learned: add to discovered, remove from seen
  if (hiraganaToLearn.length > 0) {
    await sql`
      UPDATE users SET
        discovered_hiragana = (
          SELECT COALESCE(array_agg(DISTINCT elem), '{}')
          FROM unnest(
            array_cat(COALESCE(discovered_hiragana, '{}'), ${hiraganaToLearn}::text[])
          ) AS elem
        ),
        seen_hiragana = (
          SELECT COALESCE(array_agg(elem), '{}')
          FROM unnest(COALESCE(seen_hiragana, '{}')) AS elem
          WHERE elem != ALL(${hiraganaToLearn}::text[])
        )
      WHERE clerk_id = ${userId}
    `
  }

  if (katakanaToLearn.length > 0) {
    await sql`
      UPDATE users SET
        discovered_katakana = (
          SELECT COALESCE(array_agg(DISTINCT elem), '{}')
          FROM unnest(
            array_cat(COALESCE(discovered_katakana, '{}'), ${katakanaToLearn}::text[])
          ) AS elem
        ),
        seen_katakana = (
          SELECT COALESCE(array_agg(elem), '{}')
          FROM unnest(COALESCE(seen_katakana, '{}')) AS elem
          WHERE elem != ALL(${katakanaToLearn}::text[])
        )
      WHERE clerk_id = ${userId}
    `
  }

  // Mark session lesson as completed
  await sql`
    UPDATE loop_sessions SET lesson_completed = true WHERE id = ${params.id}
  `

  return NextResponse.json({ registered: lessonKana.length })
}
