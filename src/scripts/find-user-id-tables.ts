import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name IN ('user_id', 'clerk_id')
    ORDER BY table_name
  `
  console.log(JSON.stringify(rows, null, 2))
}
main().catch(console.error)
