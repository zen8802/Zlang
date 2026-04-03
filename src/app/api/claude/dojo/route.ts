import Anthropic from '@anthropic-ai/sdk'

// UserProfile shape: { nativeLanguage, targetLanguage, level }

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const {
      scenario,
      scenarioLanguage,
      conversationHistory,
      userMessage,
      userProfile,
    } = await request.json()

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are playing a character in a language learning conversation simulator.

Scenario: ${scenario}
The learner's native language: ${userProfile.nativeLanguage}
The learner's target language: ${scenarioLanguage}
Their level: ${userProfile.level}

STRICT RULES:
1. Stay in character COMPLETELY. Speak only in ${scenarioLanguage}.
2. React naturally to errors — a convenience store clerk looks confused if they use wrong keigo, a party-goer laughs if English is too formal.
3. After EVERY character response, add a separator "---COACH---" then a brief coaching note in their NATIVE language explaining what was natural or unnatural about their last message. Keep coach notes to 2 sentences max.
4. Never break character before the ---COACH--- separator.
5. If they are doing well, your coach note should affirm specifically what worked.
6. Progress the scenario naturally — don't wait for perfect language.

Format every response as:
[Character dialogue in ${scenarioLanguage}]
---COACH---
[2-sentence coaching note in ${userProfile.nativeLanguage}]`

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage },
    ]

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
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
