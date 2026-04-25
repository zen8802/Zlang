import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No DB' }, { status: 500 })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  // Get the session's opening message (first assistant message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (await sql`
    SELECT attempt_messages FROM loop_sessions WHERE id = ${params.id}
  `) as Array<{ attempt_messages: unknown }>

  if (!rows[0]) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Keep only the first assistant message (the opening line)
  const allMessages = Array.isArray(rows[0].attempt_messages)
    ? rows[0].attempt_messages
    : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openingMessage = allMessages.find((m: any) => m.role === 'assistant')
  const resetMessages = openingMessage ? [openingMessage] : []

  await sql`
    UPDATE loop_sessions SET
      attempt_messages = ${JSON.stringify(resetMessages)}::jsonb,
      retry_messages = '[]'::jsonb,
      diagnosis = NULL,
      learn_blocks = NULL,
      milestone_card = NULL,
      phase = 'attempt',
      current_phase = 'attempt',
      current_block_index = 0,
      completed_block_ids = '{}',
      recognized_lines = '{}'::jsonb,
      session_new_kana = '{}',
      session_lesson_kana = '{}',
      lesson_completed = false,
      last_active_at = NOW()
    WHERE id = ${params.id}
  `

  return NextResponse.json({ reset: true, openingMessage: resetMessages[0] || null })
}
