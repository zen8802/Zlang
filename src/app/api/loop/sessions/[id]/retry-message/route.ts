import Anthropic from '@anthropic-ai/sdk'
import { buildKanjiConstraint } from '@/data/kanji-levels'
import { buildLanguageProfile } from '@/lib/user-profile'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { message, messages: clientMessages, learnerName } = await request.json()

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'message is required' }, { status: 400 })
    }

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
        setting, retry_messages, diagnosis, kanji_level,
        user_gender, user_birth_year, user_experience_level
      FROM loop_sessions
      WHERE id = ${sessionId}
      LIMIT 1
    `

    if (!rows || rows.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 })
    }

    const row = rows[0]
    const kanjiConstraint = buildKanjiConstraint(row.kanji_level || 1)
    const languageProfile = buildLanguageProfile({
      gender: row.user_gender,
      birthYear: row.user_birth_year,
      experienceLevel: row.user_experience_level,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diagnosis = row.diagnosis as any
    const systemPrompt = buildRetrySystemPrompt({
      characterName: row.character_name,
      characterNameJP: row.character_name_jp,
      characterDescription: row.character_description,
      characterPersonality: row.character_personality,
      characterSpeechStyle: row.character_speech_style,
      characterRelationship: row.character_relationship,
      setting: row.setting,
      diagnosis,
      kanjiConstraint,
      characterStyle: languageProfile.characterStyle,
      speechStyle: languageProfile.speechStyle,
      learnerName: typeof learnerName === 'string' ? learnerName : undefined,
    })

    // Use client-provided messages if available, otherwise fall back to DB
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []

    if (clientMessages && Array.isArray(clientMessages) && clientMessages.length > 0) {
      conversationHistory = clientMessages.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })
      )
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stored = row.retry_messages as any[]
      conversationHistory = Array.isArray(stored) ? stored : []
    }

    // Append user message
    conversationHistory.push({ role: 'user', content: message })

    // Call Claude with streaming
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: conversationHistory,
    })

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

          // Save updated retry conversation to DB
          if (process.env.DATABASE_URL) {
            try {
              conversationHistory.push({ role: 'assistant', content: fullResponse })
              const { neon: neonInner } = await import('@neondatabase/serverless')
              const sqlInner = neonInner(process.env.DATABASE_URL!)
              await sqlInner`
                UPDATE loop_sessions
                SET retry_messages = ${JSON.stringify(conversationHistory)}::jsonb,
                    phase = 'retry'
                WHERE id = ${sessionId}
              `
            } catch (dbError) {
              console.error('Failed to save loop retry messages to DB:', dbError)
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
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Loop retry-message error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// System prompt for the retry phase — includes diagnosis context
// ---------------------------------------------------------------------------

function buildRetrySystemPrompt(opts: {
  characterName: string
  characterNameJP: string
  characterDescription: string
  characterPersonality: string
  characterSpeechStyle: string
  characterRelationship: string
  setting: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  diagnosis: any
  nativeLanguage?: string
  targetLanguage?: string
  userLevel?: string
  kanjiConstraint: string
  characterStyle?: string
  speechStyle?: string
  learnerName?: string
}): string {
  const {
    characterName,
    characterNameJP,
    characterDescription,
    characterPersonality,
    characterSpeechStyle,
    characterRelationship,
    setting,
    diagnosis,
    nativeLanguage = 'English',
    targetLanguage = 'Japanese',
    userLevel = 'beginner',
    kanjiConstraint,
    characterStyle = '',
    speechStyle = '',
    learnerName = '',
  } = opts
  const demographicBlock = [characterStyle, speechStyle].filter(Boolean).join('\n\n')

  // Extract diagnosis details for the retry context
  const failureType = diagnosis?.failureType || 'vocabulary'
  const failureSummary = diagnosis?.failureSummary || 'The learner struggled with some vocabulary.'
  const targetWord = diagnosis?.targetWord || ''
  const targetPhrase = diagnosis?.targetPhrase || ''
  const retryBriefing = diagnosis?.retryBriefing || ''

  const diagnosisContext = `
RETRY CONTEXT — THE LEARNER JUST COMPLETED A TARGETED LESSON:
- Failure area: ${failureType}
- What they practiced: ${failureSummary}
${targetWord ? `- Target word: ${targetWord}` : ''}
${targetPhrase ? `- Target phrase: ${targetPhrase}` : ''}
${retryBriefing ? `- Retry briefing: ${retryBriefing}` : ''}

CRITICAL INSTRUCTION FOR RETRY:
You must subtly create natural opportunities for the learner to use what they just practiced.
Do NOT explicitly quiz them or mention they just had a lesson. Instead, steer the conversation
so they naturally need to use the vocabulary/grammar/phrase they learned.
For example, if they learned 注文(ちゅうもん), ask them what they'd like to order.
Be encouraging when they use the target language correctly.`

  return `You are playing a character in a Japanese language learning conversation simulator (Loop mode — RETRY phase).

${demographicBlock ? `${demographicBlock}\n\n` : ''}CHARACTER: ${characterName} (${characterNameJP})
${characterDescription}
Personality: ${characterPersonality}
Speech style: ${characterSpeechStyle}

SETTING: ${setting}

RELATIONSHIP: ${characterRelationship}

THE LEARNER:
- Native language: ${nativeLanguage}
- Target language: ${targetLanguage} (this is what they're learning)
- Level: ${userLevel}${learnerName ? `\n- Name: ${learnerName} (use this when an auto-reply self-introduction is appropriate)` : ''}
${diagnosisContext}

STRICT RULES:
1. Stay COMPLETELY in character. Speak in ${targetLanguage}.
2. ${kanjiConstraint}
3. For beginners: use simple vocabulary, short sentences.
4. For intermediate: natural speech, some slang is fine.
5. For advanced: full natural speech, no hand-holding.
6. React naturally to the learner's mistakes — if they use wrong politeness, look confused. If they use the wrong word, politely correct in character.
7. After your dialogue, add "---VOCAB---" then list 3-6 key vocabulary words from your dialogue, one per line:
   word|reading|romaji|meaning|pos|exampleJP|exampleRomaji|exampleEN
   where pos is one of: noun, verb, adjective, adverb, particle, phrase, greeting, counter, expression
   exampleJP is a short example sentence in Japanese using the word (different from your dialogue line), with furigana on kanji
   exampleRomaji is the romaji of the example sentence (use macrons for long vowels)
   exampleEN is the English translation of that example
   Example: 水(みず)|みず|mizu|water|noun|水(みず)をください。|mizu o kudasai.|Water, please.
   Only include words actually used in your dialogue. Include the furigana format in the word field.
8. Then add "---ROMAJI---" with the romaji reading. Use macrons for long vowels. If dialogue uses "---NEXT---", the ROMAJI section MUST also use "---NEXT---" with one segment per bubble. Do NOT include romaji for ---AUTOREPLY--- text.
9. Then add "---EN---" with natural English translation. If dialogue uses "---NEXT---", the EN section MUST also use "---NEXT---" with one segment per bubble. Do NOT include EN for ---AUTOREPLY--- text.
10. Then add "---COACH---" with ONE concise cultural fact in ${nativeLanguage}. MAX 1 sentence. Must be a specific, concrete fact — a date, a number, a rule, an origin story, a social norm. NO flowery descriptions. Include any relevant Japanese words with furigana: 漢字(かんじ) format.
11. Never break character before the separators.
12. Keep responses concise — 1-3 sentences of dialogue.
12a. MULTI-BUBBLE DIALOGUE — If your turn has TWO OR MORE natural beats, split bubbles using "---NEXT---" on its own line. Each bubble should be 1-2 sentences max — three sentences in one bubble is overwhelming.
12b. AUTO-REPLY FOR FORMULAIC LEARNER TURNS — When the natural learner response would be PURELY MECHANICAL (reciprocating a self-introduction, "thank you" back, etc.), you MAY pre-fill it. Use sparingly. Format:
     ---AUTOREPLY---
     [learner's response in Japanese, demographic-appropriate, with furigana on kanji]
     ---AUTOREPLY_EN---
     [the same in natural English]
     ---NEXT---
     [your next bubble]
   ${learnerName ? `Use the learner's name "${learnerName}" for self-introductions.` : ''}
   DO NOT auto-reply with anything that has scenario consequences. Your turn must still END with a bubble asking a concrete question.
12c. PER-BUBBLE ROMAJI/EN — When dialogue uses "---NEXT---", ROMAJI and EN must ALSO split via "---NEXT---" with one segment per bubble in matching order. VOCAB/COACH/OPTIONS still cover the full turn. Do NOT include auto-reply text in ROMAJI or EN.
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
