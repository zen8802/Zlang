import Anthropic from '@anthropic-ai/sdk'
import { buildProfileContext, type UserProfilePayload } from '@/lib/userProfileContext'
import { buildKanjiConstraint } from '@/data/kanji-levels'
import { buildLanguageProfile } from '@/lib/user-profile'

function levelAdaptiveRules(level: number): string {
  if (level <= 2) {
    return `
LEVEL-ADAPTIVE SPEECH RULES — ABSOLUTE BEGINNER (level ${level}/10):
- This learner has never studied Japanese. They will type in English.
- Speak slower: use shorter sentences (max 8-10 characters per sentence).
- Use the most common vocabulary only. Avoid idioms, slang, casual contractions.
- A real shop owner WOULD accommodate a foreign beginner — be warm and patient.
- React warmly to ANY Japanese attempt no matter how broken.
- If they switch to English, respond in simple Japanese — they'll see a translation.
- Use kanji in your dialogue WITH furigana (for recognition), but keep sentences short.
`
  }
  if (level <= 4) {
    return `
LEVEL-ADAPTIVE SPEECH RULES — BEGINNER (level ${level}/10):
- Speak slowly with simple, common vocabulary.
- Sentences max 12-15 characters.
- Use basic polite forms (です/ます).
- React encouragingly to attempts. Naturally repeat or rephrase if they seem lost.
`
  }
  if (level <= 6) {
    return `
LEVEL-ADAPTIVE SPEECH RULES — INTERMEDIATE (level ${level}/10):
- Speak at a natural conversational pace.
- Use normal vocabulary for this setting.
- Don't simplify unless they're clearly struggling.
- Some natural casual speech patterns are fine.
`
  }
  return `
LEVEL-ADAPTIVE SPEECH RULES — ADVANCED (level ${level}/10):
- Speak naturally at full speed.
- Use natural register — casual where appropriate.
- Don't slow down or simplify.
- React to register mismatches naturally.
- This person should be challenged.
`
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { message, messages: clientMessages, userProfile, learnerName } = await request.json()

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
        setting, attempt_messages, kanji_level,
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

    // Demographic-aware style strings — pulled from the snapshot we stored
    // on the session row at create time. No fresh DB call required.
    const languageProfile = buildLanguageProfile({
      gender: row.user_gender,
      birthYear: row.user_birth_year,
      experienceLevel: row.user_experience_level,
    })

    systemPrompt = buildAttemptSystemPrompt({
      characterName: row.character_name,
      characterNameJP: row.character_name_jp,
      characterDescription: row.character_description,
      characterPersonality: row.character_personality,
      characterSpeechStyle: row.character_speech_style,
      characterRelationship: row.character_relationship,
      setting: row.setting,
      userProfile,
      kanjiConstraint,
      characterStyle: languageProfile.characterStyle,
      speechStyle: languageProfile.speechStyle,
      learnerName: typeof learnerName === 'string' ? learnerName : undefined,
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
      max_tokens: 1500,
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
  userProfile?: UserProfilePayload | null
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
    nativeLanguage = 'English',
    targetLanguage = 'Japanese',
    userLevel = 'beginner',
    userProfile,
    kanjiConstraint,
    characterStyle = '',
    speechStyle = '',
    learnerName = '',
  } = opts

  const profileContext = buildProfileContext(userProfile)
  const demographicBlock = [characterStyle, speechStyle].filter(Boolean).join('\n\n')
  const level = typeof userProfile?.experience === 'number' ? userProfile.experience : 5
  const adaptiveRules = levelAdaptiveRules(level)

  return `You are playing a character in a Japanese language learning conversation simulator (Loop mode — Attempt phase).

${demographicBlock ? `${demographicBlock}\n\n` : ''}${profileContext ? `LEARNER PROFILE:\n${profileContext}\n\n` : ''}${adaptiveRules}
CHARACTER: ${characterName} (${characterNameJP})
${characterDescription}
Personality: ${characterPersonality}
Speech style: ${characterSpeechStyle}

SETTING: ${setting}

RELATIONSHIP: ${characterRelationship}

THE LEARNER:
- Native language: ${nativeLanguage}
- Target language: ${targetLanguage} (this is what they're learning)
- Level: ${userLevel}${learnerName ? `\n- Name: ${learnerName} (use this when an auto-reply self-introduction is appropriate)` : ''}

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
8. Then add "---ROMAJI---" with the romaji reading of your dialogue. Use macrons for long vowels: ō (おう/おお), ū (うう), ē (えい), ā (ああ). Example: ベーコン → bēkon, とうきょう → Tōkyō, ラーメン → rāmen. If your dialogue uses "---NEXT---" to split into multiple bubbles, the ROMAJI section MUST also use "---NEXT---" with one segment per bubble (in the same order). DO NOT include romaji for ---AUTOREPLY--- text — the romaji segments correspond to YOUR bubbles only.
9. Then add "---EN---" with a natural English translation. If your dialogue uses "---NEXT---", the EN section MUST also use "---NEXT---" with one segment per bubble (matching the dialogue order). DO NOT include EN for ---AUTOREPLY--- text.
10. Then add "---COACH---" with ONE concise cultural fact in ${nativeLanguage}. MAX 1 sentence. Must be a specific, concrete fact — a date, a number, a rule, an origin story, a social norm. NO flowery descriptions. Include any relevant Japanese words with furigana: 漢字(かんじ) format.
11. Never break character before the separators.
12. Keep responses concise — 1-3 sentences of dialogue.
12a. MULTI-BUBBLE DIALOGUE — If your turn has TWO OR MORE natural beats (e.g., a greeting THEN a topic shift, or a statement THEN a separate question), split the bubbles using "---NEXT---" on its own line between them. KEEP each bubble to 1-2 sentences max. Three sentences crammed into one bubble is OVERWHELMING.
   Example:
     あ、おつかれさまです。田中(たなか)です。
     ---NEXT---
     じてんしゃをかいにきてくださって、ありがとうございます。
     ---NEXT---
     こちらがしゃしんのじてんしゃです。まず見(み)てみませんか？
12b. AUTO-REPLY FOR FORMULAIC LEARNER TURNS — When the natural learner response to one of your bubbles would be PURELY MECHANICAL (reciprocating a self-introduction, saying "thank you" back, acknowledging a "yes please", a routine いらっしゃいませ → こんにちは echo), you MAY pre-fill the learner's response so the conversation flows without forcing them to type an obvious one-liner. Use this SPARINGLY — only when the learner has nothing meaningful to choose. Format:
     ---AUTOREPLY---
     [learner's response in Japanese, demographic-appropriate politeness, with furigana on any kanji]
     ---AUTOREPLY_EN---
     [the same in natural English]
     ---NEXT---
     [your next bubble continues the conversation]
   ${learnerName ? `Use the learner's name "${learnerName}" when the auto-reply is a self-introduction (e.g., こちらこそ、${learnerName}です).` : ''}
   Example, after introducing yourself as Tanaka:
     あ、おつかれさまです。田中(たなか)です。
     ---AUTOREPLY---
     こちらこそ、よろしくおねがいします。
     ---AUTOREPLY_EN---
     Likewise, nice to meet you.
     ---NEXT---
     じてんしゃをかいにきてくださって、ありがとうございます。
   DO NOT auto-reply with anything that has scenario consequences (orders, decisions, agreements to do something). ONLY for mechanical pleasantries. Your turn must still END with a bubble that asks the learner a concrete question or request.
12c. PER-BUBBLE ROMAJI AND EN — When your dialogue is split into multiple bubbles via "---NEXT---", the ROMAJI and EN sections must ALSO be split via "---NEXT---" with one segment per dialogue bubble in matching order. VOCAB, COACH, OPTIONS, JP_OF_YOURS, and HINTS still cover the FULL combined turn (no splitting). Do NOT include the auto-reply text in ROMAJI or EN — those describe YOUR bubbles only.
   Example:
     [dialogue line 1]
     ---NEXT---
     [dialogue line 2]
     ---VOCAB---
     ...
     ---ROMAJI---
     [romaji of line 1]
     ---NEXT---
     [romaji of line 2]
     ---EN---
     [english of line 1]
     ---NEXT---
     [english of line 2]
     ---COACH---
     ...
13. Progress the scenario naturally. Don't wait for perfect Japanese.
13a. CRITICAL — NEVER end your turn on a pure acknowledgment OR pure greeting. Every message must end with a CONCRETE QUESTION OR REQUEST the learner can directly answer. If your natural reaction would be a one-line ack like "good choice", "okay", "got it", "sounds good", "わかった", "了解(りょうかい)", "いいね", "はい" — DO NOT stop there. In the SAME message, immediately chain into the next conversation beat from the SETTING's CONVERSATION FLOW (or, if no flow is defined, the next natural step in the scenario). Examples:
    BAD: "おう、硬(かた)めだな！いいぞ。" — pure ack, nothing to respond to.
    BAD: "いらっしゃい！座(すわ)って！" — pure greeting, nothing to respond to.
    GOOD: "おう、硬(かた)めだな！いいぞ。…はい、お待(ま)たせ！何(なに)か飲(の)み物(もの)は？" — ack + advances to next beat.
    GOOD: "いらっしゃい！座(すわ)って！何(なに)にしますか？" — greeting + concrete question.
    Acceptable endings: a question, a request, a price/total, a "what about X?" hook. UNACCEPTABLE: "welcome", "sit down", "have a seat", "good choice" — leaves the learner with nothing.
13c. PAYMENT ENDING — when the learner asks for the bill (お会計, お勘定, "check please", "kaikei", etc.) OR hands you payment, your response MUST be exactly the closing farewell: a brief ありがとうございました line (you may add ようこそ来(き)てくれて or またお越(こ)しください). DO NOT ask another question after payment. DO NOT extend the scenario. The conversation ENDS here. The app will auto-detect the farewell and wrap up the lesson.
14. If the learner writes in ${nativeLanguage}, gently respond in ${targetLanguage} and the coach note should say "Try responding in Japanese next time!"
15. After ---COACH---, always add ---OPTIONS--- followed by exactly 4 response options the learner could say next.
Each option MUST include furigana for all kanji in the same format: 漢字(かんじ).
Each option format: [Japanese with furigana] | [romaji] | [English] | [safe/natural/bold/funny]
Option 1: safest, most polite response
Option 2: natural, normal response
Option 3: bold or casual response
Option 4: funny or unexpected response
All options must be grammatically correct Japanese at the learner's level.
16. If the learner's most recent message was written in English (mostly Latin characters, no Japanese script), after the ---OPTIONS--- section add ---JP_OF_YOURS--- on its own line followed by ONE line in this exact format:
    [Japanese] | [romaji] | [the original English]
    This shows the learner how their English thought would naturally be said in Japanese. Do NOT add explanation or grammar notes. Just the one line. If the learner already wrote in Japanese, do NOT include this section at all.
17. After all the above sections, if the learner is a beginner (level 1-4 in the LEARNER PROFILE — if no profile is shown, assume beginner), add ---HINTS--- on its own line followed by 3-6 short ENGLISH chip ideas, ONE per line. Format each line as either:
    [short english phrase]
    or
    [short english phrase] | [short hint in parentheses]
    Examples for a ramen shop after the chef asks "what'll you have?":
      tonkotsu (rich pork broth)
      shoyu (soy sauce)
      shio (salt — lighter)
      with extra chashu
      no green onions
    Each chip UNDER 6 words, plain ENGLISH, representing a plausible English answer to the QUESTION you just asked the learner. Do NOT translate them to Japanese — the learner will type their full English sentence using one of them. ALWAYS emit HINTS on every beginner turn where you ask a concrete question. Only skip HINTS for the closing/farewell beat where the conversation is wrapping up.`
}
