// ---------------------------------------------------------------------------
// Seed vocabulary_cards from /src/data/vocabulary-seed.ts
// Usage:
//   DATABASE_URL="$(grep ^DATABASE_URL .env.local | cut -d= -f2-)" \
//     npx tsx src/scripts/seed-vocabulary.ts
// ---------------------------------------------------------------------------

import { VOCABULARY_SEED } from '../data/vocabulary-seed'

async function seed() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(dbUrl)

  console.log(`Seeding ${VOCABULARY_SEED.length} vocabulary cards...`)

  let inserted = 0
  for (const card of VOCABULARY_SEED) {
    await sql`
      INSERT INTO vocabulary_cards (
        id, word, reading, romaji, english, english_alts,
        jlpt_level, frequency_rank, domain, sub_domain,
        rarity, part_of_speech, example_jp, example_reading,
        example_en, card_color, card_emoji, appears_in_scenarios
      ) VALUES (
        ${card.id},
        ${card.word},
        ${card.reading},
        ${card.romaji},
        ${card.english},
        ${card.englishAlts},
        ${card.jlptLevel},
        ${card.frequencyRank},
        ${card.domain},
        ${card.subDomain},
        ${card.rarity},
        ${card.partOfSpeech},
        ${card.exampleJP},
        ${card.exampleReading},
        ${card.exampleEN},
        ${card.cardColor},
        ${card.cardEmoji},
        ${card.appearsInScenarios}
      )
      ON CONFLICT (id) DO UPDATE SET
        word = EXCLUDED.word,
        reading = EXCLUDED.reading,
        english = EXCLUDED.english,
        example_jp = EXCLUDED.example_jp,
        example_reading = EXCLUDED.example_reading,
        example_en = EXCLUDED.example_en,
        card_color = EXCLUDED.card_color,
        card_emoji = EXCLUDED.card_emoji,
        rarity = EXCLUDED.rarity,
        frequency_rank = EXCLUDED.frequency_rank
    `
    inserted++
    process.stdout.write('.')
  }

  const [{ count }] = (await sql`SELECT COUNT(*) FROM vocabulary_cards`) as Array<{
    count: string
  }>
  console.log(`\nDone. Seeded ${inserted}. Total cards in DB: ${count}`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('\nSeed failed:', err)
  process.exit(1)
})
