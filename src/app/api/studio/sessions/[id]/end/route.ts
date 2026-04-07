import Anthropic from '@anthropic-ai/sdk'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    // Load conversation from DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messages: any[] = []

    if (process.env.DATABASE_URL) {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL)

      const rows = await sql`
        SELECT messages
        FROM studio_sessions
        WHERE id = ${sessionId}
        LIMIT 1
      `

      if (!rows || rows.length === 0) {
        return Response.json({ error: 'Session not found' }, { status: 404 })
      }

      const stored = rows[0].messages
      messages = Array.isArray(stored) ? stored : []
    } else {
      return Response.json(
        { error: 'No database configured — cannot load session' },
        { status: 404 }
      )
    }

    if (messages.length < 2) {
      return Response.json(
        { error: 'Not enough conversation to generate a lesson' },
        { status: 400 }
      )
    }

    // Build transcript
    const transcript = messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((m: any) => `${m.role === 'user' ? 'LEARNER' : 'CHARACTER'}: ${m.content}`)
      .join('\n\n')

    const lessonPrompt = `Based on this conversation, generate a Japanese lesson for the learner.

Conversation transcript:
${transcript}

Generate ONLY valid JSON (no markdown fences, no commentary):
{
  "summary": "What happened in the conversation",
  "performance": {
    "overallScore": 1-10,
    "naturalness": 1-10,
    "accuracy": 1-10,
    "culturalFit": 1-10,
    "feedback": "2-3 sentences of honest feedback"
  },
  "newVocab": [
    { "word": "...", "reading": "...", "english": "...", "jlptLevel": "...", "context": "how it was used in the conversation" }
  ],
  "grammarPoints": [
    { "pattern": "...", "explanation": "...", "example": "...", "jlptLevel": "..." }
  ],
  "corrections": [
    { "original": "what the user said", "corrected": "what they should have said", "explanation": "why" }
  ],
  "culturalNotes": [
    "Things about this scenario the user should know culturally"
  ],
  "shadowing": {
    "sentence": "best sentence from the conversation to practice",
    "why": "why this sentence"
  }
}`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: lessonPrompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON — strip markdown fences if Claude adds them despite instructions
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lesson: any
    try {
      lesson = JSON.parse(cleaned)
    } catch {
      return Response.json(
        { error: 'Failed to parse lesson JSON from Claude', raw: cleaned },
        { status: 502 }
      )
    }

    return Response.json({ lesson })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
