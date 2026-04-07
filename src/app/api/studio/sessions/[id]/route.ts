import { SCENARIO_TEMPLATES } from '@/data/scenarios'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: 'No database configured' }, { status: 500 })
  }

  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)

    const rows = await sql`
      SELECT id, scenario_id, scenario_title, character_name, character_description,
             setting, target_language, native_language, user_level, messages, status, created_at
      FROM studio_sessions
      WHERE id = ${sessionId}
      LIMIT 1
    `

    if (!rows || rows.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 })
    }

    const row = rows[0]

    // Look up scenario for extra display data
    const scenario = SCENARIO_TEMPLATES.find(s => s.id === row.scenario_id)

    // Parse messages — convert DB role format to client format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbMessages = (row.messages || []) as Array<{ role: string; content: string }>
    const clientMessages = dbMessages
      .filter(m => m.role !== 'system')
      .map((m, i) => {
        if (m.role === 'assistant') {
          const parts = m.content.split('---COACH---')
          return {
            id: `msg-${i}`,
            role: 'character' as const,
            content: parts[0]?.trim() || m.content,
            coachNote: parts[1]?.trim() || undefined,
            timestamp: Date.now() - (dbMessages.length - i) * 60000,
          }
        }
        return {
          id: `msg-${i}`,
          role: 'user' as const,
          content: m.content,
          timestamp: Date.now() - (dbMessages.length - i) * 60000,
        }
      })

    return Response.json({
      id: row.id,
      scenarioId: row.scenario_id,
      scenarioTitle: row.scenario_title || scenario?.title || 'Conversation',
      scenarioTitleJP: scenario?.titleJP || '',
      scenarioEmoji: scenario?.emoji || '💬',
      characterName: row.character_name || scenario?.character.name || 'Character',
      characterNameJP: scenario?.character.nameJP || '',
      characterColor: scenario?.color || '#1B4F8A',
      characterAvatar: scenario?.character.avatar || '',
      voiceId: scenario?.character.voiceId || 'JOcmGzB8OFjY8MhjHHEf',
      characterDescription: row.character_description || scenario?.character.description || '',
      messages: clientMessages,
      status: row.status,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
