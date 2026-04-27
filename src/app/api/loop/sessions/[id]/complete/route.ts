import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ completed: true })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  await sql`
    UPDATE loop_sessions SET
      phase = 'complete',
      current_phase = 'complete',
      status = 'complete',
      last_active_at = NOW()
    WHERE id = ${params.id}
  `

  return NextResponse.json({ completed: true })
}
