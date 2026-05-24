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
        phase, loop_mode, user_experience_level, kanji_level,
        user_gender, user_birth_year,
        attempt_messages, retry_messages,
        diagnosis, learn_blocks, milestone_card,
        current_phase, current_block_index, completed_block_ids,
        recognized_lines, last_active_at, is_abandoned,
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
      loopMode: row.loop_mode || 'intermediate',
      userExperienceLevel: row.user_experience_level ?? 5,
      kanjiLevel: row.kanji_level ?? 1,
      userGender: row.user_gender || 'other',
      userBirthYear: row.user_birth_year ?? 1995,
      attemptMessages: row.attempt_messages || [],
      retryMessages: row.retry_messages || [],
      diagnosis: row.diagnosis || null,
      learnBlocks: row.learn_blocks || null,
      milestone: row.milestone_card || null,
      currentPhase: row.current_phase || null,
      currentBlockIndex: row.current_block_index || 0,
      completedBlockIds: row.completed_block_ids || [],
      recognizedLines: row.recognized_lines || {},
      lastActiveAt: row.last_active_at || null,
      isAbandoned: row.is_abandoned || false,
      createdAt: row.created_at,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Loop session load error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: 'No DB' }, { status: 500 })
  }
  try {
    const body = await request.json()
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL!)

    if (typeof body.is_favorite === 'boolean') {
      await sql`UPDATE loop_sessions SET is_favorite = ${body.is_favorite} WHERE id = ${params.id}`
      return Response.json({ updated: true, is_favorite: body.is_favorite })
    }

    return Response.json({ error: 'Nothing to update' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: 'No DB' }, { status: 500 })
  }
  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL!)
    await sql`DELETE FROM loop_sessions WHERE id = ${params.id}`
    return Response.json({ deleted: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
