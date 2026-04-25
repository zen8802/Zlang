import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB' }, { status: 500 })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const rows = (await sql`
    SELECT * FROM saved_lessons
    WHERE id = ${params.id} AND user_id = ${userId}
  `) as Row[]

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await sql`UPDATE saved_lessons SET last_studied_at = NOW() WHERE id = ${params.id}`

  return NextResponse.json({ lesson: rows[0] })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB' }, { status: 500 })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  await sql`DELETE FROM saved_lessons WHERE id = ${params.id} AND user_id = ${userId}`

  return NextResponse.json({ deleted: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB' }, { status: 500 })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const body = await req.json()
  if (body.incrementRetaken) {
    await sql`
      UPDATE saved_lessons SET
        times_retaken = COALESCE(times_retaken, 0) + 1,
        last_studied_at = NOW()
      WHERE id = ${params.id} AND user_id = ${userId}
    `
  }

  return NextResponse.json({ updated: true })
}
