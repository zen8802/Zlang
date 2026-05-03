import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  await sql`
    CREATE TABLE IF NOT EXISTS learned_words (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      japanese TEXT NOT NULL,
      reading TEXT DEFAULT '',
      romaji TEXT DEFAULT '',
      english TEXT DEFAULT '',
      part_of_speech TEXT,
      example_jp TEXT,
      example_romaji TEXT,
      example_en TEXT,
      jlpt_level TEXT,
      source_session_id TEXT,
      source_scenario_title TEXT,
      learned_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, japanese)
    )
  `
  console.log('Created learned_words table')
}

main().catch(console.error)
