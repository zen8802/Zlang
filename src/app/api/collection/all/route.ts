import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CardRow = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserCardRow = any

/** Map part_of_speech to a display category key */
function posToCategory(pos: string): string {
  switch (pos) {
    case 'particle':
    case 'copula':
    case 'auxiliary':
      return 'grammar'
    case 'expression':
      return 'expression'
    case 'i-adjective':
    case 'na-adjective':
      return 'adjective'
    case 'counter':
    case 'numeral':
      return 'numbers'
    default:
      return pos // noun, verb, adverb, adjective, etc.
  }
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      wordsByCategory: {},
      stats: { collected: 0, total: 0, mastered: 0 },
    })
  }

  const { userId } = auth()
  const effectiveUserId = userId || 'guest'

  const sql = neon(process.env.DATABASE_URL)

  // Ensure user row exists
  await sql`INSERT INTO users (clerk_id) VALUES (${effectiveUserId}) ON CONFLICT (clerk_id) DO NOTHING`

  // Fetch user's kana discovery data
  const userQuery = sql`
    SELECT discovered_hiragana, discovered_katakana, discovered_kanji,
           seen_hiragana, seen_katakana, seen_kanji
    FROM users WHERE clerk_id = ${effectiveUserId}
  `
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRows = (await userQuery) as any[]
  const userRow = userRows[0] || null

  // Fetch all vocabulary cards with optional user card data
  const rows = (await sql`
    SELECT
      vc.id,
      vc.word,
      vc.reading,
      vc.romaji,
      vc.english,
      vc.jlpt_level AS "jlptLevel",
      vc.frequency_rank AS "frequencyRank",
      vc.rarity,
      vc.part_of_speech AS "partOfSpeech",
      vc.example_jp AS "exampleJP",
      vc.example_en AS "exampleEN",
      vc.card_color AS "cardColor",
      vc.card_emoji AS "cardEmoji",
      uc.status AS "ucStatus",
      uc.encounter_count AS "ucEncounterCount",
      uc.production_count AS "ucProductionCount",
      uc.mastered_at AS "ucMasteredAt"
    FROM vocabulary_cards vc
    LEFT JOIN user_cards uc ON uc.card_id = vc.id AND uc.user_id = ${effectiveUserId}
    ORDER BY vc.frequency_rank ASC
  `) as (CardRow & UserCardRow)[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wordsByCategory: Record<string, { card: any; userCard: any | null }[]> = {}
  let collected = 0
  let mastered = 0

  for (const row of rows) {
    const category = posToCategory(row.partOfSpeech || '')

    if (!wordsByCategory[category]) {
      wordsByCategory[category] = []
    }

    const card = {
      id: row.id,
      word: row.word,
      reading: row.reading,
      romaji: row.romaji,
      english: row.english,
      jlptLevel: row.jlptLevel,
      frequencyRank: row.frequencyRank,
      rarity: row.rarity,
      partOfSpeech: row.partOfSpeech,
      exampleJP: row.exampleJP,
      exampleEN: row.exampleEN,
      cardColor: row.cardColor,
      cardEmoji: row.cardEmoji,
    }

    const userCard = row.ucStatus
      ? {
          status: row.ucStatus,
          encounterCount: parseInt(row.ucEncounterCount || '0', 10),
          productionCount: parseInt(row.ucProductionCount || '0', 10),
          masteredAt: row.ucMasteredAt,
        }
      : null

    if (userCard) {
      collected++
      if (userCard.status === 'mastered') mastered++
    }

    wordsByCategory[category].push({ card, userCard })
  }

  return NextResponse.json({
    hiragana: userRow?.discovered_hiragana || [],
    hiraganaSeen: userRow?.seen_hiragana || [],
    katakana: userRow?.discovered_katakana || [],
    katakanaSeen: userRow?.seen_katakana || [],
    kanji: userRow?.discovered_kanji || [],
    wordsByCategory,
    stats: {
      collected,
      total: rows.length,
      mastered,
    },
  })
}
