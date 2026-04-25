import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ phrases: [] })
  }

  const { userId } = auth()
  if (!userId) return NextResponse.json({ phrases: [] })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const result = (await sql`
    SELECT vc.word
    FROM user_cards uc
    JOIN vocabulary_cards vc ON vc.id = uc.card_id
    WHERE uc.user_id = ${userId}
      AND vc.part_of_speech = 'expression'
  `) as Row[]

  return NextResponse.json({
    phrases: result.map((r: Row) => r.word as string),
  })
}
