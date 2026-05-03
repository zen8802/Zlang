import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'
async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  await sql`ALTER TABLE phrasebook ADD COLUMN IF NOT EXISTS example_romaji TEXT`
  console.log('Done')
}
main().catch(console.error)
