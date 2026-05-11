import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  console.log('Adding kanji_level to users...')
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS kanji_level INTEGER DEFAULT 1`

  console.log('Adding kanji_level to loop_sessions...')
  await sql`ALTER TABLE loop_sessions ADD COLUMN IF NOT EXISTS kanji_level INTEGER DEFAULT 1`

  console.log('Done!')
}

main().catch(console.error)
