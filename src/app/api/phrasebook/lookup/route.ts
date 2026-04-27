import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No DB' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const word = searchParams.get('word')
  if (!word) {
    return NextResponse.json({ error: 'word param is required' }, { status: 400 })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const rows = await sql`
    SELECT word, reading, romaji, english, part_of_speech
    FROM vocabulary_cards
    WHERE word = ${word} OR reading = ${word}
    LIMIT 5
  `

  return NextResponse.json({ results: rows })
}
