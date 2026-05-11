import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  const usersCols = await sql`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `
  console.log('users columns:')
  console.log(JSON.stringify(usersCols, null, 2))

  const loopCols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'loop_sessions'
    ORDER BY ordinal_position
  `
  console.log('\nloop_sessions columns:')
  console.log(JSON.stringify(loopCols, null, 2))
}

main().catch(console.error)
