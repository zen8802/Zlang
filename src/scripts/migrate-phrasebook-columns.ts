/**
 * Add new columns to phrasebook table for full word metadata.
 * Run with: npx tsx src/scripts/migrate-phrasebook-columns.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)

  console.log('Adding new columns to phrasebook table...')

  await sql`
    ALTER TABLE phrasebook
    ADD COLUMN IF NOT EXISTS part_of_speech TEXT,
    ADD COLUMN IF NOT EXISTS english_alts TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS example_jp TEXT,
    ADD COLUMN IF NOT EXISTS example_en TEXT,
    ADD COLUMN IF NOT EXISTS jlpt_level TEXT
  `

  console.log('Done! Columns added.')
}

main().catch(console.error)
