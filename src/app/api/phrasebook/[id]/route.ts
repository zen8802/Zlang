import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No DB' }, { status: 500 })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  await sql`DELETE FROM phrasebook WHERE id = ${params.id} AND user_id = ${userId}`

  return NextResponse.json({ deleted: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No DB' }, { status: 500 })
  }

  const { userNote } = await request.json()

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  await sql`UPDATE phrasebook SET user_note = ${userNote || null} WHERE id = ${params.id} AND user_id = ${userId}`

  return NextResponse.json({ updated: true })
}
