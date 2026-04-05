import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const { videoTitle, transcript, platform, userLevel = 'beginner' } = await req.json()

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are Zlang's Japanese language lesson generator.
An English speaker learning Japanese just shared this video.
Extract and teach the Japanese content from it.

Platform: ${platform}
Video Title: ${videoTitle}
Available transcript/metadata: ${transcript}
Learner level: ${userLevel}

Generate a complete lesson. Return ONLY valid JSON, no markdown fences:

{
  "videoSummary": "2 sentence description of what this video is about",
  "languageConfidence": "high|medium|low",
  "sentences": [
    {
      "id": "s1",
      "japanese": "Japanese sentence from the video",
      "reading": "hiragana reading",
      "english": "natural English translation",
      "romanji": "romaji pronunciation guide",
      "timestamp": "00:00",
      "keywords": [
        {
          "word": "word",
          "reading": "reading",
          "romaji": "romaji",
          "partOfSpeech": "noun",
          "meaning": "meaning",
          "jlptLevel": "N4",
          "exampleSentence": "example",
          "culturalNote": "optional note or null"
        }
      ],
      "grammarNote": {
        "pattern": "grammar pattern",
        "explanation": "explanation",
        "jlptLevel": "N5",
        "otherExamples": ["example1", "example2"]
      },
      "emotionTag": "funny|emotional|casual|formal|tense|heartwarming"
    }
  ],
  "culturalDeepDive": {
    "headline": "one compelling insight",
    "body": "2-3 paragraphs connecting language to culture",
    "neverInTextbook": "something no textbook covers"
  },
  "whyIsFunny": null,
  "lessonVocab": [
    {
      "word": "word",
      "reading": "reading",
      "english": "meaning",
      "jlptLevel": "N4",
      "memoryHook": "memorable hook tied to this video"
    }
  ],
  "keyGrammarPoints": ["list", "of", "patterns"],
  "overallJlptLevel": "N5",
  "shadowing": {
    "targetSentence": "best sentence to practice",
    "whyThisSentence": "why this is worth shadowing",
    "breakDown": [
      { "chunk": "part", "tip": "pronunciation tip" }
    ]
  }
}

If the content doesn't have clear Japanese dialogue, still generate useful content from the title and context. Set languageConfidence to "low".`
      }],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        stream.on('text', (text) => {
          controller.enqueue(encoder.encode(text))
        })
        stream.on('end', () => {
          controller.close()
        })
        stream.on('error', (err) => {
          controller.enqueue(encoder.encode(JSON.stringify({ error: err.message })))
          controller.close()
        })
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
