export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
  }

  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL!)

    const rows = await sql`
      SELECT
        id, scenario_id, scenario_title, scenario_title_jp, scenario_emoji,
        character_name, character_name_jp, character_color, character_avatar,
        character_description, character_personality, character_speech_style,
        character_relationship, voice_id, setting, opening_line,
        phase, attempt_messages, retry_messages,
        diagnosis, learn_blocks, milestone,
        created_at
      FROM loop_sessions
      WHERE id = ${sessionId}
      LIMIT 1
    `

    if (!rows || rows.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 })
    }

    const row = rows[0]

    return Response.json({
      id: row.id,
      scenarioId: row.scenario_id,
      scenarioTitle: row.scenario_title,
      scenarioTitleJP: row.scenario_title_jp,
      scenarioEmoji: row.scenario_emoji,
      characterName: row.character_name,
      characterNameJP: row.character_name_jp,
      characterColor: row.character_color,
      characterAvatar: row.character_avatar,
      characterDescription: row.character_description,
      characterPersonality: row.character_personality,
      characterSpeechStyle: row.character_speech_style,
      characterRelationship: row.character_relationship,
      voiceId: row.voice_id,
      setting: row.setting,
      openingLine: row.opening_line,
      phase: row.phase,
      attemptMessages: row.attempt_messages || [],
      retryMessages: row.retry_messages || [],
      diagnosis: row.diagnosis || null,
      learnBlocks: row.learn_blocks || null,
      milestone: row.milestone || null,
      createdAt: row.created_at,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Loop session load error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
