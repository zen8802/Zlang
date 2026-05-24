import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  console.log('Adding demographic columns to users...')
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'other',
    ADD COLUMN IF NOT EXISTS birth_year INTEGER DEFAULT 1995,
    ADD COLUMN IF NOT EXISTS experience_level INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS native_language TEXT DEFAULT 'en',
    ADD COLUMN IF NOT EXISTS target_language TEXT DEFAULT 'ja'
  `
  // age was never persisted but drop defensively in case anyone added it
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS age`

  console.log('Mirroring demographics on loop_sessions...')
  await sql`
    ALTER TABLE loop_sessions
    ADD COLUMN IF NOT EXISTS user_gender TEXT DEFAULT 'other',
    ADD COLUMN IF NOT EXISTS user_birth_year INTEGER DEFAULT 1995
  `

  console.log('Done.')
}

main().catch(console.error)
