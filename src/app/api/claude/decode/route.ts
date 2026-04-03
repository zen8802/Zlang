import Anthropic from '@anthropic-ai/sdk'

interface UserProfile {
  nativeLanguage: 'english' | 'japanese'
  targetLanguage: 'english' | 'japanese'
  level: 'beginner' | 'intermediate' | 'advanced'
  interests: string[]
  goal: string
}

function buildSystemPrompt(profile: UserProfile): string {
  return `You are Zlang's language learning AI. You are a culturally fluent expert in both Japanese and English with deep knowledge of pop culture, anime, NBA, internet culture, and the specific challenges each nationality faces learning the other's language.

User profile:
- Native language: ${profile.nativeLanguage}
- Learning: ${profile.targetLanguage}
- Level: ${profile.level}
- Interests: ${profile.interests.join(', ')}
- Goal: ${profile.goal}

Core teaching philosophy:
1. Culture and language are inseparable. Always ground explanations in cultural context.
2. Teach living language — how people actually speak, not textbook constructs.
3. Emotional anchors create memory. Connect every explanation to the clip's emotional moment.
4. Never shame the learner. Lead with specific praise before any correction.
5. For Japanese learners: politeness register (keigo vs casual) is the #1 priority above all grammar.
6. For English learners: naturalness and social fit matter more than grammatical perfection.
7. Be vivid, specific, and occasionally funny. You are a brilliant friend, not a textbook.

Always respond in ${profile.nativeLanguage} unless the exercise explicitly requires ${profile.targetLanguage}.
Keep all explanations tied to the exact clip content provided.`
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const {
      clipTitle,
      transcript,
      translation,
      targetLanguage,
      userLevel,
      userProfile,
    } = await request.json()

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = buildSystemPrompt(userProfile)

    const userMessage = `Analyze this ${targetLanguage} clip for a language lesson:

Title: ${clipTitle}
Transcript: ${transcript}
Translation: ${translation}
Learner level: ${userLevel}

Generate a lesson decode in this EXACT JSON structure. Return only valid JSON, no markdown:

{
  "mainGrammarPoint": {
    "title": "string — name of grammar point",
    "explanation": "string — clear explanation with analogy",
    "example": "string — example from the actual clip",
    "nativeEquivalent": "string — how this maps to native language thinking",
    "jlptLevel": "N5|N4|N3|N2|N1 or CEFR A1-C2"
  },
  "keyLines": [
    {
      "timestamp": "00:00",
      "original": "string — exact line in target language",
      "literal": "string — word for word translation",
      "natural": "string — how a native would actually say this",
      "whyItMatters": "string — why this specific phrasing is important"
    }
  ],
  "culturalNote": {
    "headline": "string — one compelling sentence",
    "body": "string — 2-3 paragraphs connecting this moment to broader culture",
    "neverInTextbook": "string — the thing about this that NO textbook teaches"
  },
  "vocab": [
    {
      "word": "string",
      "reading": "string — hiragana reading if Japanese",
      "translation": "string",
      "partOfSpeech": "string",
      "clipContext": "string — exactly where/how it appeared in the clip",
      "memoryHook": "string — vivid memory anchor tied to the clip moment"
    }
  ],
  "politenessAlert": "string | null",
  "whyIsFunny": "string | null"
}`

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        stream.on('text', (text) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        })
        stream.on('end', () => {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        })
        stream.on('error', (error) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
          )
          controller.close()
        })
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
