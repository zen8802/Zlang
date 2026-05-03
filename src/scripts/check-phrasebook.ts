import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  const r = await sql`SELECT id, japanese, reading FROM phrasebook ORDER BY created_at DESC LIMIT 5`
  console.log('Entries:', JSON.stringify(r, null, 2))

  // Check constraints
  const c = await sql`
    SELECT conname, contype, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'phrasebook'::regclass
  `
  console.log('Constraints:', JSON.stringify(c, null, 2))
}

main().catch(console.error)
