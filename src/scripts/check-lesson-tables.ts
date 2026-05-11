import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('vocabulary_cards', 'user_cards', 'loop_sessions')
    ORDER BY table_name
  `
  console.log('Tables found:', JSON.stringify(tables, null, 2))

  for (const t of ['vocabulary_cards', 'user_cards']) {
    try {
      const cols = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${t}
        ORDER BY ordinal_position
      `
      console.log(`\n${t} columns:`, JSON.stringify(cols, null, 2))
    } catch (e) {
      console.log(`\n${t} ERROR:`, e)
    }
  }

  // Check loop_sessions for lesson_word_ids
  const lsCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'loop_sessions' AND column_name = 'lesson_word_ids'
  `
  console.log('\nlesson_word_ids on loop_sessions:', lsCols.length > 0 ? 'EXISTS' : 'MISSING')
}

main().catch(console.error)
