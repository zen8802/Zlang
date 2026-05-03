import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  // Remove duplicates first (keep oldest)
  await sql`
    DELETE FROM phrasebook a
    USING phrasebook b
    WHERE a.user_id = b.user_id
      AND a.japanese = b.japanese
      AND a.created_at > b.created_at
  `
  console.log('Removed duplicates')

  // Add unique constraint
  await sql`
    ALTER TABLE phrasebook
    DROP CONSTRAINT IF EXISTS phrasebook_user_word_unique
  `
  await sql`
    ALTER TABLE phrasebook
    ADD CONSTRAINT phrasebook_user_word_unique UNIQUE (user_id, japanese)
  `
  console.log('Added unique constraint on (user_id, japanese)')
}

main().catch(console.error)
