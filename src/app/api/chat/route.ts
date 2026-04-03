import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const MODEL = 'claude-sonnet-4-20250514'

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(params: Record<string, unknown>): string {
  const corridor = (params.corridor as string) || 'en-to-jp'
  const level = (params.level as string) || 'beginner'
  const isEnToJp = corridor === 'en-to-jp'
  const nativeLang = isEnToJp ? 'English' : 'Japanese'
  const targetLang = isEnToJp ? 'Japanese' : 'English'

  return `You are Zlang, an expert language tutor specializing in ${targetLang} education for ${nativeLang} speakers.

Student profile:
- Corridor: ${corridor} (learning ${targetLang} from ${nativeLang})
- Level: ${level}

Core teaching principles:
1. ALWAYS adapt complexity to the student's level (${level}).
   - beginner: simple vocab, basic grammar, romaji + kana for JP, full translations
   - basics: common patterns, some compound sentences, less hand-holding
   - intermediate: natural speech patterns, nuance, slang, minimal translation help
   - advanced: near-native complexity, idioms, cultural subtlety, minimal English/Japanese scaffolding
2. Emphasize REAL, natural language — how people actually speak, not textbook stiffness.
3. Language is culture. Always weave in cultural context.
4. Be encouraging but honest. Praise specifics, note concrete improvements.
5. For en-to-jp: explain Japanese in English, include romaji AND kana/kanji.
6. For jp-to-en: explain English with Japanese scaffolding, include natural English examples.
7. Be concise. Students learn by doing, not reading essays.
8. Have personality — you're a cool, knowledgeable tutor, not a textbook.`
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, ...params } = body

    const systemPrompt = buildSystemPrompt(params)
    let userMessage = ''

    switch (action) {
      // -----------------------------------------------------------------------
      // Comprehension questions after immersion viewing
      // -----------------------------------------------------------------------
      case 'comprehension': {
        const { clipTitle, transcript, translation } = params
        userMessage = `The student just watched a clip without subtitles for the first time. Generate 2 comprehension questions to activate their brain and check what they picked up.

Clip: "${clipTitle || 'Untitled'}"
Transcript: ${transcript || ''}
Translation: ${translation || ''}

Rules:
- Questions should be answerable even if the student only caught fragments
- One question about general meaning/situation, one about a specific word or phrase they might have caught
- Keep questions short and clear
- Write in the student's native language

Format your response as plain text:
Question 1: [question]

Question 2: [question]`
        break
      }

      // -----------------------------------------------------------------------
      // Decode: linguistic analysis of the clip
      // -----------------------------------------------------------------------
      case 'decode': {
        const { clipTitle, transcript, translation, grammarPoints } = params
        userMessage = `Analyze this clip for language learning. Break it into 3 key linguistic elements.

Clip: "${clipTitle || 'Untitled'}"
Transcript: ${transcript || ''}
Translation: ${translation || ''}
Grammar focus: ${(grammarPoints as string[])?.join(', ') || 'general'}

For each element, provide:
- The original line from the transcript
- A literal word-by-word translation
- A natural/fluent translation
- Grammar explanation (adapted to student's level)
- Cultural context note
- Difficulty level (N5/N4/N3/N2/N1 for Japanese, or A1-C2 for English)

Respond in this exact JSON format (return ONLY valid JSON, no markdown fences):
{
  "elements": [
    {
      "line": "original text",
      "literalTranslation": "word by word",
      "naturalTranslation": "how you'd actually say it",
      "grammarExplanation": "clear grammar breakdown",
      "culturalContext": "cultural note",
      "level": "N5"
    }
  ],
  "summary": "Brief overall insight about this clip's language"
}`
        break
      }

      // -----------------------------------------------------------------------
      // Grade shadowing attempt
      // -----------------------------------------------------------------------
      case 'grade-shadowing': {
        const { original, userAttempt, targetLanguage } = params
        userMessage = `Compare the student's shadowing attempt to the original.

Original (${targetLanguage || 'Japanese'}):
"${original || ''}"

Student's attempt (speech-to-text transcription):
"${userAttempt || ''}"

Note: Speech-to-text may be imperfect, so be generous with minor transcription differences.

Rate and respond in this exact JSON format (return ONLY valid JSON, no markdown fences):
{
  "rhythmScore": 3,
  "stressScore": 3,
  "naturalnessScore": 3,
  "overallStars": 3,
  "feedback": "encouraging overall assessment",
  "tips": ["specific improvement tip 1", "specific improvement tip 2"],
  "encouragement": "motivating closing message"
}

Each score is 1-5. Be encouraging — shadowing is hard!`
        break
      }

      // -----------------------------------------------------------------------
      // Grade written response
      // -----------------------------------------------------------------------
      case 'grade-response': {
        const { userResponse, context, corridor: corrVal } = params
        const isEnToJpCorridor = corrVal === 'en-to-jp'
        const targetLang = isEnToJpCorridor ? 'Japanese' : 'English'

        userMessage = `Grade this student's written response in ${targetLang}.

Context (what the student was responding to):
${context || ''}

Student's response:
"${userResponse || ''}"

Grade across these four dimensions (each 1-5) and provide detailed feedback.

Respond in this exact JSON format (return ONLY valid JSON, no markdown fences):
{
  "naturalness": 4,
  "culturalFit": 3,
  "grammarAccuracy": 4,
  "creativity": 3,
  "overallFeedback": "Honest, encouraging overall assessment in 2-3 sentences",
  "improvedVersion": "A more natural/polished version of what they wrote",
  "specificPraise": "One specific thing they did well, explained clearly",
  "oneThingToFix": "One specific, actionable improvement with an example"
}

Be honest but kind. The student is learning — celebrate progress while pointing out growth areas.`
        break
      }

      // -----------------------------------------------------------------------
      // Cultural deep dive
      // -----------------------------------------------------------------------
      case 'cultural-dive': {
        const { clipTitle: title, clipContext, culturalNotes, culturalTheme } = params
        userMessage = `Generate an engaging cultural deep dive based on this clip.

Clip: "${title || 'Untitled'}"
Context: ${clipContext || ''}
Cultural notes: ${culturalNotes || ''}
Theme: ${culturalTheme || ''}

Write 3 rich paragraphs exploring the cultural dimensions:

Paragraph 1: The cultural significance — what's happening beneath the surface of this interaction? Why does this matter in the culture?

Paragraph 2: The broader connection — how does this connect to larger cultural values, social norms, or historical context? Include a surprising "did you know?" fact.

Paragraph 3: The language-culture bridge — how does understanding this culture make your language sound more natural? What mistakes do foreigners commonly make here?

Write in a warm, conversational tone — like a knowledgeable friend sharing fascinating insights over coffee. Make it memorable and personal.

Separate paragraphs with a blank line.`
        break
      }

      // -----------------------------------------------------------------------
      // Dojo conversation
      // -----------------------------------------------------------------------
      case 'conversation': {
        const { scenario, messages } = params
        // For conversation, we pass messages directly
        const formattedMessages = (messages as Array<{ role: string; content: string }>)?.map(
          (m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }),
        ) || []

        const encoder = new TextEncoder()
        const stream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system: `${systemPrompt}\n\nYou are now in CONVERSATION DOJO mode, role-playing: "${scenario || 'casual chat'}". Stay in character. After each response, add a brief (Tutor note: ...) with corrections/tips.`,
          messages: formattedMessages,
        })

        const readable = new ReadableStream({
          async start(controller) {
            stream.on('text', (text: string) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
              )
            })
            stream.on('end', () => {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            })
            stream.on('error', (error: Error) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`),
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
      }

      // -----------------------------------------------------------------------
      // Humor analysis
      // -----------------------------------------------------------------------
      case 'humor-analyze': {
        const { clipContext: humorCtx, transcript: humorTranscript } = params
        userMessage = `Analyze the humor in this clip. Help the student understand why it's funny.

Context: ${humorCtx || ''}
Transcript: ${humorTranscript || ''}

Cover:
1. What's the joke? — Plain explanation
2. Language tricks — Puns, wordplay, double meanings
3. Cultural layer — References that make it funny to native speakers
4. Humor type — Category: pun, sarcasm, manzai, slapstick, deadpan, etc.
5. Key vocabulary — Essential words/phrases for the humor
6. Try it yourself — A similar joke structure the student could attempt

Make the explanation fun!`
        break
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
    }

    // Stream the response using SSE
    const encoder = new TextEncoder()
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const readable = new ReadableStream({
      async start(controller) {
        stream.on('text', (text: string) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
          )
        })
        stream.on('end', () => {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        })
        stream.on('error', (error: Error) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`),
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
