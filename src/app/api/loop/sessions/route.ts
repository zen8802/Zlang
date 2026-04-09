import Anthropic from '@anthropic-ai/sdk'
import { SCENARIO_TEMPLATES, CHARACTER_ROSTER } from '@/data/scenarios'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getScenarioById(id: string): any {
  return SCENARIO_TEMPLATES.find(s => s.id === id) || null
}

function resolveCharacterFromRoster(name: string) {
  const lower = name.toLowerCase()
  return CHARACTER_ROSTER.find(c => lower.includes(c.name.toLowerCase())) || null
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { scenarioId, customPrompt } = await request.json()

    if (!scenarioId) {
      return Response.json({ error: 'scenarioId is required' }, { status: 400 })
    }

    const scenario = getScenarioById(scenarioId)
    if (!scenario) {
      return Response.json({ error: `Scenario "${scenarioId}" not found` }, { status: 404 })
    }

    const sessionId = `loop_${Date.now()}`
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let characterName = scenario.character.name
    let characterNameJP = scenario.character.nameJP
    const characterColor = scenario.color || '#1B4F8A'
    let characterAvatar = scenario.character.avatar
    let voiceId = scenario.character.voiceId || 'JOcmGzB8OFjY8MhjHHEf'
    let characterDescription = scenario.character.description
    let characterPersonality = scenario.character.personality
    let characterSpeechStyle = scenario.character.speechStyle
    let characterRelationship = scenario.character.relationship
    let setting = scenario.setting
    let openingLine = scenario.openingLine
    let scenarioTitle = scenario.title
    let scenarioTitleJP = scenario.titleJP
    let scenarioEmoji = scenario.emoji

    // For custom scenarios, use Claude to generate the session details
    if (scenarioId === 'custom' && customPrompt) {
      const generationResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Generate a Japanese language learning scenario based on this request: "${customPrompt}"

Return ONLY valid JSON (no markdown fences):
{
  "characterName": "a Japanese first name",
  "characterNameJP": "name in hiragana",
  "characterDescription": "1-sentence description",
  "characterPersonality": "personality traits",
  "characterSpeechStyle": "how they speak Japanese",
  "characterRelationship": "relationship to the learner",
  "setting": "vivid 1-2 sentence setting description in English",
  "openingLine": "the character's opening line in Japanese with furigana for kanji: 漢字(かんじ) format",
  "scenarioTitle": "short English title",
  "scenarioTitleJP": "short Japanese title",
  "scenarioEmoji": "one fitting emoji"
}`,
          },
        ],
      })

      const raw = generationResponse.content[0].type === 'text' ? generationResponse.content[0].text : ''
      const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

      try {
        const generated = JSON.parse(cleaned)
        characterName = generated.characterName || characterName
        characterNameJP = generated.characterNameJP || characterNameJP
        characterDescription = generated.characterDescription || characterDescription
        characterPersonality = generated.characterPersonality || characterPersonality
        characterSpeechStyle = generated.characterSpeechStyle || characterSpeechStyle
        characterRelationship = generated.characterRelationship || characterRelationship
        setting = generated.setting || setting
        openingLine = generated.openingLine || openingLine
        scenarioTitle = generated.scenarioTitle || scenarioTitle
        scenarioTitleJP = generated.scenarioTitleJP || scenarioTitleJP
        scenarioEmoji = generated.scenarioEmoji || scenarioEmoji

        // Try to match a voice from the roster
        const match = resolveCharacterFromRoster(characterName)
        if (match) {
          voiceId = match.voiceId
          characterAvatar = match.avatar
        }
      } catch {
        // If parsing fails, continue with defaults — the custom prompt still informs the opening
        console.error('Failed to parse custom scenario generation, using defaults')
      }
    }

    // Generate the opening message via Claude so it fits the loop context
    const systemPrompt = buildLoopSystemPrompt({
      characterName,
      characterNameJP,
      characterDescription,
      characterPersonality,
      characterSpeechStyle,
      characterRelationship,
      setting,
    })

    const opening = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `[SYSTEM: The conversation is starting now. Deliver your opening line as ${characterName}. Stay in character. This is the very first message the learner sees — greet them naturally according to the scenario. Include the ---VOCAB---, ---ROMAJI---, ---EN---, ---COACH---, and ---OPTIONS--- sections.]`,
        },
      ],
    })

    const openingMessage = opening.content[0].type === 'text' ? opening.content[0].text : ''

    const sessionData = {
      id: sessionId,
      scenarioId,
      scenarioTitle,
      scenarioTitleJP,
      scenarioEmoji,
      characterName,
      characterNameJP,
      characterColor,
      characterAvatar,
      characterDescription,
      characterPersonality,
      characterSpeechStyle,
      characterRelationship,
      voiceId,
      setting,
      openingLine,
      phase: 'attempt',
      attemptMessages: [{ role: 'assistant', content: openingMessage }],
      retryMessages: [],
      diagnosis: null,
      learnBlocks: null,
      milestone: null,
      createdAt: new Date().toISOString(),
    }

    // Persist to DB if available
    if (process.env.DATABASE_URL) {
      try {
        const { neon } = await import('@neondatabase/serverless')
        const sql = neon(process.env.DATABASE_URL!)
        await sql`
          INSERT INTO loop_sessions (
            id, scenario_id, scenario_title, scenario_title_jp, scenario_emoji,
            character_name, character_name_jp, character_color, character_avatar,
            character_description, character_personality, character_speech_style,
            character_relationship, voice_id, setting, opening_line,
            phase, attempt_messages, retry_messages,
            diagnosis, learn_blocks, milestone,
            created_at
          )
          VALUES (
            ${sessionId}, ${scenarioId}, ${scenarioTitle}, ${scenarioTitleJP}, ${scenarioEmoji},
            ${characterName}, ${characterNameJP}, ${characterColor}, ${characterAvatar},
            ${characterDescription}, ${characterPersonality}, ${characterSpeechStyle},
            ${characterRelationship}, ${voiceId}, ${setting}, ${openingLine},
            'attempt',
            ${JSON.stringify([{ role: 'assistant', content: openingMessage }])}::jsonb,
            '[]'::jsonb,
            NULL,
            NULL,
            NULL,
            NOW()
          )
        `
      } catch (dbError) {
        console.error('Failed to save loop session to DB:', dbError)
      }
    }

    return Response.json({
      sessionId,
      session: sessionData,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Loop session creation error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// Shared system prompt builder for the loop's attempt phase
// ---------------------------------------------------------------------------

function buildLoopSystemPrompt(opts: {
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
