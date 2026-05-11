import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const ADMIN_CLERK_ID = process.env.ADMIN_CLERK_ID || ''

export async function POST() {
  const { userId } = auth()
  if (!userId || !ADMIN_CLERK_ID || userId !== ADMIN_CLERK_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No DB' }, { status: 500 })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  await sql`
    UPDATE users SET
      discovered_kanji = '{}',
      seen_kanji = '{}',
      kanji_level = 1
    WHERE clerk_id = ${userId}
  `

  await sql`DELETE FROM user_cards WHERE user_id = ${userId}`
  await sql`DELETE FROM phrasebook WHERE user_id = ${userId}`

  await sql`
    UPDATE loop_sessions SET
      lesson_completed = false
    WHERE user_id = ${userId}
  `

  return NextResponse.json({ reset: true })
}
