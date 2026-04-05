export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!process.env.DATABASE_URL) return Response.json({ error: 'No database' }, { status: 500 })
  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)
    const rows = await sql`SELECT * FROM lessons WHERE id = ${params.id}`
    if (!rows.length) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ lesson: rows[0] })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!process.env.DATABASE_URL) return Response.json({ error: 'No database' }, { status: 500 })
  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)
    const body = await req.json()

    await sql`
      UPDATE lessons SET
        title = ${body.title},
        title_jp = ${body.titleJP || body.title_jp || ''},
        description = ${body.description || ''},
        jlpt_level = ${body.jlptLevel || body.jlpt_level || 'N5'},
        unit = ${body.unit || 1},
        "order" = ${body.order || 0},
        estimated_minutes = ${body.estimatedMinutes || body.estimated_minutes || 10},
        target_language = ${body.targetLanguage || body.target_language || 'japanese'},
        blocks = ${JSON.stringify(body.blocks || [])},
        total_xp = ${body.totalXP || body.total_xp || 0},
        tags = ${body.tags || []},
        is_published = ${body.isPublished ?? body.is_published ?? false},
        updated_at = NOW()
      WHERE id = ${params.id}
    `

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!process.env.DATABASE_URL) return Response.json({ error: 'No database' }, { status: 500 })
  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)
    await sql`DELETE FROM lessons WHERE id = ${params.id}`
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
