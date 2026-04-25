import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ saved: false })
  }

  // Support both application/json (normal fetch) and text/plain (sendBeacon)
  const contentType = req.headers.get('content-type') || ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    if (contentType.includes('application/json')) {
      body = await req.json()
    } else {
      const text = await req.text()
      body = JSON.parse(text)
    }
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const {
    currentPhase,
    currentBlockIndex,
    completedBlockIds,
    attemptMessages,
    retryMessages,
    recognizedLines,
    diagnosis,
    learnBlocks,
    isAbandoned,
  } = body

  // Handle abandon separately — short-circuit
  if (isAbandoned !== undefined) {
    await sql`
      UPDATE loop_sessions
      SET is_abandoned = ${!!isAbandoned}, last_active_at = NOW()
      WHERE id = ${params.id}
    `
    return NextResponse.json({ saved: true })
  }

  await sql`
    UPDATE loop_sessions SET
      current_phase       = COALESCE(${currentPhase ?? null}, current_phase),
      current_block_index = COALESCE(${currentBlockIndex ?? null}, current_block_index),
      completed_block_ids = COALESCE(${completedBlockIds ?? null}, completed_block_ids),
      attempt_messages    = COALESCE(${attemptMessages ? JSON.stringify(attemptMessages) : null}::jsonb, attempt_messages),
      retry_messages      = COALESCE(${retryMessages ? JSON.stringify(retryMessages) : null}::jsonb, retry_messages),
      recognized_lines    = COALESCE(${recognizedLines ? JSON.stringify(recognizedLines) : null}::jsonb, recognized_lines),
      diagnosis           = COALESCE(${diagnosis ? JSON.stringify(diagnosis) : null}::jsonb, diagnosis),
      learn_blocks        = COALESCE(${learnBlocks ? JSON.stringify(learnBlocks) : null}::jsonb, learn_blocks),
      last_active_at      = NOW()
    WHERE id = ${params.id}
  `

  return NextResponse.json({ saved: true })
}
