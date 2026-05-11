import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  await sql`ALTER TABLE loop_sessions ADD COLUMN IF NOT EXISTS lesson_word_ids TEXT[] DEFAULT '{}'`
  console.log('Added lesson_word_ids')
}

main().catch(console.error)
