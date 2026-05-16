import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `
  console.log(JSON.stringify(rows.map((r) => r.table_name), null, 2))
}
main().catch(console.error)
