import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // If DATABASE_URL is configured, sync to Neon
  if (process.env.DATABASE_URL) {
    try {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL)
      const profile = await req.json()

      await sql`
        INSERT INTO users (id, email, native_language, target_language, level)
        VALUES (${userId}, ${profile.email || ''}, ${profile.nativeLanguage || 'english'},
                ${profile.targetLanguage || 'japanese'}, ${profile.level || 'beginner'})
        ON CONFLICT (id) DO NOTHING
      `

      // Initialize streak record
      await sql`
        INSERT INTO streaks (user_id, current_streak, longest_streak, total_xp)
        VALUES (${userId}, 0, 0, 0)
        ON CONFLICT (user_id) DO NOTHING
      `

      return NextResponse.json({ success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'DB sync failed'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  // If no DB configured, just acknowledge
  return NextResponse.json({ success: true, note: 'No database configured' })
}
