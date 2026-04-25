import { NextResponse } from 'next/server'

export async function POST() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ cleaned: false })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  await sql`
    UPDATE loop_sessions
    SET is_abandoned = true
    WHERE phase != 'complete'
      AND is_abandoned = false
      AND last_active_at < NOW() - INTERVAL '7 days'
  `

  return NextResponse.json({ cleaned: true })
}
