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
    const { message, messages: clientMessages } = await request.json()

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'message is required' }, { status: 400 })
    }

    // Load session from DB to reconstruct system prompt
    let systemPrompt = ''
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []

    if (!process.env.DATABASE_URL) {
      return Response.json(
        { error: 'DATABASE_URL not configured — cannot load session' },
        { status: 500 }
      )
    }

    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL!)

    const rows = await sql`
      SELECT
        character_name, character_name_jp, character_description,
        character_personality, character_speech_style, character_relationship,
        setting, attempt_messages
      FROM loop_sessions
      WHERE id = ${sessionId}
      LIMIT 1
    `

    if (!rows || rows.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 })
    }

    const row = rows[0]

    systemPrompt = buildAttemptSystemPrompt({
      characterName: row.character_name,
      characterNameJP: row.character_name_jp,
      characterDescription: row.character_description,
      characterPersonality: row.character_personality,
      characterSpeechStyle: row.character_speech_style,
      characterRelationship: row.character_relationship,
      setting: row.setting,
    })

    // Use client-provided messages if available, otherwise fall back to DB
    if (clientMessages && Array.isArray(clientMessages) && clientMessages.length > 0) {
      conversationHistory = clientMessages.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })
      )
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stored = row.attempt_messages as any[]
      conversationHistory = Array.isArray(stored) ? stored : []
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
              const { neon: neonInner } = await import('@neondatabase/serverless')
              const sqlInner = neonInner(process.env.DATABASE_URL!)
              await sqlInner`
                UPDATE loop_sessions
                SET attempt_messages = ${JSON.stringify(conversationHistory)}::jsonb
                WHERE id = ${sessionId}
              `
            } catch (dbError) {
              console.error('Failed to save loop attempt messages to DB:', dbError)
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
    console.error('Loop message error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// System prompt for the attempt phase
// ---------------------------------------------------------------------------

function buildAttemptSystemPrompt(opts: {
  characterName: string
  characterNameJP: string
  characterDescription: string
  characterPersonality: string
  characterSpeechStyle: string
  characterRelationship: string
  setting: string
  nativeLanguage?: string
  targetLanguage?: string
  userLevel?: string
}): string {
  const {
    characterName,
    characterNameJP,
    characterDescription,
    characterPersonality,
    characterSpeechStyle,
    characterRelationship,
    setting,
    nativeLanguage = 'English',
    targetLanguage = 'Japanese',
    userLevel = 'beginner',
  } = opts

  return `You are playing a character in a Japanese language learning conversation simulator (Loop mode — Attempt phase).

CHARACTER: ${characterName} (${characterNameJP})
${characterDescription}
Personality: ${characterPersonality}
Speech style: ${characterSpeechStyle}

SETTING: ${setting}

RELATIONSHIP: ${characterRelationship}

THE LEARNER:
- Native language: ${nativeLanguage}
- Target language: ${targetLanguage} (this is what they're learning)
- Level: ${userLevel}

STRICT RULES:
1. Stay COMPLETELY in character. Speak in ${targetLanguage}.
2. ALWAYS write kanji with furigana in this exact format: 漢字(かんじ) — the kanji followed by its reading in parentheses using hiragana. Do this for ALL kanji in your dialogue. Example: 今日(きょう)は良(よ)い天気(てんき)ですね。
3. For beginners: use simple vocabulary, short sentences.
4. For intermediate: natural speech, some slang is fine.
5. For advanced: full natural speech, no hand-holding.
6. React naturally to the learner's mistakes — if they use wrong politeness, look confused. If they use the wrong word, politely correct in character.
7. After your dialogue, add "---VOCAB---" then list 3-6 key vocabulary words from your dialogue, one per line:
   word|reading|romaji|meaning|pos
   where pos is one of: noun, verb, adjective, adverb, particle, phrase, greeting, counter, expression
   Example: 注文(ちゅうもん)|ちゅうもん|chuumon|order|noun
   Only include words actually used in your dialogue. Include the furigana format in the word field.
8. Then add "---ROMAJI---" with the romaji reading of your ENTIRE dialogue.
9. Then add "---EN---" with a natural English translation of your dialogue.
10. Then add "---COACH---" with ONE concise cultural fact in ${nativeLanguage}. MAX 1 sentence. Must be a specific, concrete fact — a date, a number, a rule, an origin story, a social norm. NO flowery descriptions. Include any relevant Japanese words with furigana: 漢字(かんじ) format.
11. Never break character before the separators.
12. Keep responses concise — 1-3 sentences of dialogue.
13. Progress the scenario naturally. Don't wait for perfect Japanese.
14. If the learner writes in ${nativeLanguage}, gently respond in ${targetLanguage} and the coach note should say "Try responding in Japanese next time!"
15. After ---COACH---, always add ---OPTIONS--- followed by exactly 4 response options the learner could say next.
Each option MUST include furigana for all kanji in the same format: 漢字(かんじ).
Each option format: [Japanese with furigana] | [romaji] | [English] | [safe/natural/bold/funny]
Option 1: safest, most polite response
Option 2: natural, normal response
Option 3: bold or casual response
Option 4: funny or unexpected response
All options must be grammatically correct Japanese at the learner's level.`
}
