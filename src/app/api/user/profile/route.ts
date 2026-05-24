import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { computeAge } from '@/lib/user-profile'

/**
 * GET /api/user/profile
 *
 * Returns the user's persistent demographic profile from the users table.
 * `age` in the response is computed from birthYear at request time — we
 * never store age, so the row stays stable as the user ages.
 *
 * Auto-creates the row on first read so this is also a safe "ensure user
 * exists" call from the onboarding flow.
 */
export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      gender: 'other',
      birthYear: 1995,
      age: computeAge(1995),
      experienceLevel: 3,
      nativeLanguage: 'en',
      targetLanguage: 'ja',
      kanjiLevel: 1,
      worldNumber: 1,
    })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  // Ensure the row exists so the first-time experience doesn't 404.
  await sql`
    INSERT INTO users (clerk_id) VALUES (${userId})
    ON CONFLICT (clerk_id) DO NOTHING
  `

  const rows = (await sql`
    SELECT gender, birth_year, experience_level,
           native_language, target_language,
           kanji_level, world_number
    FROM users WHERE clerk_id = ${userId}
  `) as Array<{
    gender: string | null
    birth_year: number | null
    experience_level: number | null
    native_language: string | null
    target_language: string | null
    kanji_level: number | null
    world_number: number | null
  }>

  const row = rows[0]
  if (!row) {
    // Shouldn't happen after the INSERT, but be defensive.
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const birthYear = row.birth_year ?? 1995
  return NextResponse.json({
    gender: row.gender || 'other',
    birthYear,
    age: computeAge(birthYear),
    experienceLevel: row.experience_level ?? 3,
    nativeLanguage: row.native_language || 'en',
    targetLanguage: row.target_language || 'ja',
    kanjiLevel: row.kanji_level ?? 1,
    worldNumber: row.world_number ?? 1,
  })
}

/**
 * PATCH /api/user/profile
 *
 * Accepts a strict allowlist of demographic + preference fields. Anything
 * else in the body is silently ignored — never trust client payloads to
 * shape what gets written.
 */
export async function PATCH(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ updated: false, persisted: false })
  }

  const body = await req.json()

  // Allowlist + light validation
  const gender =
    body.gender === 'male' || body.gender === 'female' || body.gender === 'other'
      ? body.gender
      : undefined
  const birthYear =
    typeof body.birthYear === 'number' && body.birthYear > 1900 && body.birthYear <= new Date().getFullYear()
      ? body.birthYear
      : undefined
  const experienceLevel =
    typeof body.experienceLevel === 'number' && body.experienceLevel >= 1 && body.experienceLevel <= 10
      ? Math.round(body.experienceLevel)
      : undefined
  const nativeLanguage =
    typeof body.nativeLanguage === 'string' && body.nativeLanguage.length <= 8
      ? body.nativeLanguage
      : undefined
  const targetLanguage =
    typeof body.targetLanguage === 'string' && body.targetLanguage.length <= 8
      ? body.targetLanguage
      : undefined

  if (
    gender === undefined &&
    birthYear === undefined &&
    experienceLevel === undefined &&
    nativeLanguage === undefined &&
    targetLanguage === undefined
  ) {
    return NextResponse.json({ updated: false })
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  // Ensure the row exists.
  await sql`
    INSERT INTO users (clerk_id) VALUES (${userId})
    ON CONFLICT (clerk_id) DO NOTHING
  `

  // COALESCE lets us update just the fields the caller provided without
  // clobbering the rest. Pass null for omitted fields → COALESCE keeps existing.
  await sql`
    UPDATE users SET
      gender = COALESCE(${gender ?? null}, gender),
      birth_year = COALESCE(${birthYear ?? null}, birth_year),
      experience_level = COALESCE(${experienceLevel ?? null}, experience_level),
      native_language = COALESCE(${nativeLanguage ?? null}, native_language),
      target_language = COALESCE(${targetLanguage ?? null}, target_language)
    WHERE clerk_id = ${userId}
  `

  return NextResponse.json({ updated: true })
}
