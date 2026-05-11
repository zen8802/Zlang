import { LEVEL_KANJI, buildKanjiConstraint, checkLevelGate } from '@/data/kanji-levels'

/**
 * Returns the current kanji level for a user along with the constraint
 * prompt and permitted-character string. Used by every AI route that
 * generates Japanese output for the user.
 *
 * Falls back to Level 1 if the row is missing or the DB isn't configured.
 */
export async function getUserKanjiLevel(
  userId: string,
): Promise<{ level: number; constraint: string; permittedKanji: string }> {
  let level = 1

  if (process.env.DATABASE_URL && userId) {
    try {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (await sql`
        SELECT kanji_level FROM users WHERE clerk_id = ${userId}
      `) as { kanji_level: number | null }[]
      if (rows[0]?.kanji_level) level = rows[0].kanji_level
    } catch {
      /* fall through to default */
    }
  }

  return {
    level,
    constraint: buildKanjiConstraint(level),
    permittedKanji: LEVEL_KANJI[level] || LEVEL_KANJI[1],
  }
}

/**
 * Check if the user has met the gate to advance to the next level and,
 * if so, update their kanji_level. Returns whether an advancement occurred.
 *
 * Called after every kanji is marked as learned.
 */
export async function checkAndAdvanceLevel(
  userId: string,
): Promise<{ advanced: boolean; newLevel?: number; previousLevel: number }> {
  if (!process.env.DATABASE_URL || !userId) {
    return { advanced: false, previousLevel: 1 }
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (await sql`
    SELECT kanji_level, discovered_kanji
    FROM users
    WHERE clerk_id = ${userId}
  `) as { kanji_level: number | null; discovered_kanji: string[] | null }[]

  const previousLevel = rows[0]?.kanji_level ?? 1
  const discoveredKanji: string[] = rows[0]?.discovered_kanji ?? []

  const gate = checkLevelGate(previousLevel, discoveredKanji)
  if (!gate.canAdvance || !gate.nextLevel) {
    return { advanced: false, previousLevel }
  }

  const newLevel = gate.nextLevel
  await sql`
    UPDATE users SET kanji_level = ${newLevel}
    WHERE clerk_id = ${userId}
  `

  return { advanced: true, newLevel, previousLevel }
}
