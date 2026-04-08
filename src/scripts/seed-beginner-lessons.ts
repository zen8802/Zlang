// ──────────────────────────────────────────────
// Seed Beginner Lessons into Neon DB
// Usage: npx tsx src/scripts/seed-beginner-lessons.ts
// ──────────────────────────────────────────────

import { getBeginnerLessons } from '../data/beginner-lessons'

async function seed() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(dbUrl)
  const lessons = getBeginnerLessons()

  console.log(`Seeding ${lessons.length} beginner lessons...`)

  for (const lesson of lessons) {
    const totalXP = lesson.blocks.reduce(
      (sum: number, b: { xpReward?: number }) => sum + (b.xpReward || 0),
      0
    )

    await sql`
      INSERT INTO lessons (
        id, title, title_jp, description, jlpt_level, unit, "order",
        estimated_minutes, target_language, blocks, tags, is_published, total_xp
      )
      VALUES (
        ${lesson.id},
        ${lesson.title},
        ${lesson.titleJP},
        ${lesson.description},
        ${lesson.jlptLevel},
        ${lesson.unit},
        ${lesson.order},
        ${lesson.estimatedMinutes},
        ${lesson.targetLanguage},
        ${JSON.stringify(lesson.blocks)}::jsonb,
        ${lesson.tags || []},
        ${lesson.isPublished},
        ${totalXP}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        title_jp = EXCLUDED.title_jp,
        description = EXCLUDED.description,
        blocks = EXCLUDED.blocks,
        tags = EXCLUDED.tags,
        is_published = EXCLUDED.is_published,
        total_xp = EXCLUDED.total_xp,
        estimated_minutes = EXCLUDED.estimated_minutes,
        updated_at = NOW()
    `

    console.log(`  Seeded: ${lesson.title} (${totalXP} XP, ${lesson.blocks.length} blocks)`)
  }

  console.log('\nDone! All beginner lessons seeded.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
