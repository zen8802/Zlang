export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
  }

  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)

    const totalRows = await sql`SELECT COUNT(*) as count FROM clips`
    const byType = await sql`
      SELECT content_type, COUNT(*) as count
      FROM clips GROUP BY content_type ORDER BY count DESC
    `
    const byLevel = await sql`
      SELECT jlpt_level, COUNT(*) as count
      FROM clips GROUP BY jlpt_level ORDER BY jlpt_level
    `
    const channels = await sql`
      SELECT channel_id, channel_name, content_type, total_clips, last_mined, active
      FROM channel_registry ORDER BY total_clips DESC
    `

    return Response.json({
      totalClips: totalRows[0]?.count || 0,
      byType,
      byLevel,
      channels,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
