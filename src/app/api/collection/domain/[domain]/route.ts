import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CardRow = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserCardRow = any

export async function GET(
  _req: NextRequest,
  { params }: { params: { domain: string } },
) {
  const domain = params.domain
  if (!domain) {
    return NextResponse.json({ error: 'Missing domain' }, { status: 400 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ cards: [] })
  }

  const { userId } = auth()
  const effectiveUserId = userId || 'guest'

  const sql = neon(process.env.DATABASE_URL)

  const cards = (await sql`
    SELECT
      id, word, reading, romaji, english,
      english_alts AS "englishAlts",
      jlpt_level AS "jlptLevel",
      frequency_rank AS "frequencyRank",
      domain, sub_domain AS "subDomain",
      rarity, part_of_speech AS "partOfSpeech",
      example_jp AS "exampleJP",
      example_reading AS "exampleReading",
      example_en AS "exampleEN",
      card_color AS "cardColor",
      card_emoji AS "cardEmoji"
    FROM vocabulary_cards
    WHERE domain = ${domain}
    ORDER BY frequency_rank ASC
  `) as CardRow[]

  const userCards = (await sql`
    SELECT
      uc.card_id AS "cardId",
      uc.encounter_count AS "encounterCount",
      uc.production_count AS "productionCount",
      uc.recognition_count AS "recognitionCount",
      uc.contexts,
      uc.status,
      uc.first_encountered_at AS "firstEncounteredAt",
      uc.first_produced_at AS "firstProducedAt",
      uc.mastered_at AS "masteredAt"
    FROM user_cards uc
    JOIN vocabulary_cards vc ON vc.id = uc.card_id
    WHERE uc.user_id = ${effectiveUserId} AND vc.domain = ${domain}
  `) as UserCardRow[]

  const userCardMap = new Map<string, UserCardRow>()
  for (const uc of userCards) userCardMap.set(uc.cardId, uc)

  const result = cards.map((card) => ({
    card,
    userCard: userCardMap.get(card.id) || null,
  }))

  return NextResponse.json({ cards: result })
}
