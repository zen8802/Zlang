export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ lessons: [] })
  }
  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)
    const lessons = await sql`SELECT * FROM lessons ORDER BY unit, "order"`
    return Response.json({ lessons })
  } catch (error) {
    return Response.json({ lessons: [], error: String(error) })
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: 'No database' }, { status: 500 })
  }
  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)
    const body = await req.json()
    const id = `lesson-${Date.now()}`

    await sql`
      INSERT INTO lessons (id, title, title_jp, description, jlpt_level, unit, "order", estimated_minutes, target_language, blocks, total_xp, tags, is_published)
      VALUES (${id}, ${body.title}, ${body.titleJP || ''}, ${body.description || ''}, ${body.jlptLevel || 'N5'}, ${body.unit || 1}, ${body.order || 0}, ${body.estimatedMinutes || 10}, ${body.targetLanguage || 'japanese'}, ${JSON.stringify(body.blocks || [])}, ${body.totalXP || 0}, ${body.tags || []}, ${body.isPublished || false})
    `

    return Response.json({ lesson: { id, ...body } })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
