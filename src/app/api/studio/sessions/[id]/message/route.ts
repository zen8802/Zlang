import Anthropic from '@anthropic-ai/sdk'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'message is required' }, { status: 400 })
    }

    // Load session from DB
    let systemPrompt = ''
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []

    if (process.env.DATABASE_URL) {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL)

      const rows = await sql`
        SELECT scenario_id, messages, target_language, native_language, user_level
        FROM studio_sessions
        WHERE id = ${sessionId}
        LIMIT 1
      `

      if (!rows || rows.length === 0) {
        return Response.json({ error: 'Session not found' }, { status: 404 })
      }

      // Reconstruct system prompt from scenario data
      const { SCENARIO_TEMPLATES } = await import('@/data/scenarios')
      const scenario = SCENARIO_TEMPLATES.find(s => s.id === rows[0].scenario_id)
      if (scenario) {
        const char = scenario.character
        systemPrompt = `You are playing a character in a Japanese language learning conversation simulator.

CHARACTER: ${char.name} (${char.nameJP})
${char.description}
Personality: ${char.personality}
Speech style: ${char.speechStyle}

SETTING: ${scenario.setting}
RELATIONSHIP: ${char.relationship}

THE LEARNER:
- Native language: ${rows[0].native_language || 'english'}
- Target language: ${rows[0].target_language || 'japanese'}
- Level: ${rows[0].user_level || 'beginner'}

RULES:
1. Stay in character. Speak in ${rows[0].target_language || 'japanese'}.
2. ALWAYS write kanji with furigana: 漢字(かんじ) format. Do this for ALL kanji.
3. After your dialogue, add "---VOCAB---" then list 3-6 key words from your dialogue, one per line: word|reading|romaji|meaning|pos (pos = noun/verb/adjective/adverb/particle/phrase/greeting/counter/expression). Include furigana in word field.
4. Then add "---ROMAJI---" with romaji of your entire dialogue.
5. Then add "---EN---" with natural English translation of your dialogue.
6. Then add "---COACH---" with ONE concise cultural fact in ${rows[0].native_language || 'english'}. MAX 1 sentence. Must be specific and concrete — a date, number, rule, origin, or social norm. NO flowery descriptions. Include relevant Japanese words with furigana: 漢字(かんじ) format.
7. Keep responses concise — 1-3 sentences of dialogue.
8. React naturally to mistakes. Progress the scenario.
9. After ---COACH---, always add ---OPTIONS--- followed by exactly 4 response options.
Each option MUST include furigana for all kanji: 漢字(かんじ) format.
Each option format: [Japanese with furigana] | [romaji] | [English] | [safe/natural/bold/funny]
Option 1: safest, most polite response
Option 2: natural, normal response
Option 3: bold or casual response
Option 4: funny or unexpected response
All options must be grammatically correct Japanese at the learner's level.`
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stored = rows[0].messages as any[]
      conversationHistory = Array.isArray(stored) ? stored : []
    } else {
      return Response.json(
        { error: 'No database configured — cannot load session history' },
        { status: 404 }
      )
    }

    // Append user message
    conversationHistory.push({ role: 'user', content: message })

    // Call Claude with streaming
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: conversationHistory,
    })

    // Collect full response for DB save
    let fullResponse = ''

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        stream.on('text', (text) => {
          fullResponse += text
          controller.enqueue(encoder.encode(text))
        })

        stream.on('end', async () => {
          controller.close()

          // Save updated conversation to DB
          if (process.env.DATABASE_URL) {
            try {
              conversationHistory.push({ role: 'assistant', content: fullResponse })
              const { neon } = await import('@neondatabase/serverless')
              const sql = neon(process.env.DATABASE_URL)
              await sql`
                UPDATE studio_sessions
                SET messages = ${JSON.stringify(conversationHistory)}::jsonb
                WHERE id = ${sessionId}
              `
            } catch (dbError) {
              console.error('Failed to save messages to DB:', dbError)
            }
          }
        })

        stream.on('error', (error) => {
          controller.enqueue(
            encoder.encode(`\n\n[ERROR: ${error.message}]`)
          )
          controller.close()
        })
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
