import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1) }
  const sql = neon(process.env.DATABASE_URL)
  console.log('Adding is_favorite column to loop_sessions...')
  await sql`ALTER TABLE loop_sessions ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false`
  console.log('Done!')
}

main().catch(console.error)
