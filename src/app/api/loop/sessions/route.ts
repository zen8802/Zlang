import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { SCENARIO_TEMPLATES, CHARACTER_ROSTER } from '@/data/scenarios'
import { buildProfileContext, type UserProfilePayload } from '@/lib/userProfileContext'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getScenarioById(id: string): any {
  return SCENARIO_TEMPLATES.find(s => s.id === id) || null
}

/**
 * Map an AI-generated custom scenario object into the same shape that
 * SCENARIO_TEMPLATES uses, so the rest of the route can consume it
 * unchanged. Cultural context, dramatic question, registry note, and
 * cultural trap are folded into the `setting` so the system prompt
 * builder picks them up automatically.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function customScenarioToTemplate(custom: any): any {
  const character = custom?.character || {}
  const culturalContext = Array.isArray(custom?.culturalContext)
    ? custom.culturalContext.filter(Boolean).join(' ')
    : ''
  const enrichmentLines = [
    custom?.dramaticQuestion ? `DRAMATIC TENSION: ${custom.dramaticQuestion}` : '',
    custom?.culturalTrap ? `WATCH OUT: ${custom.culturalTrap}` : '',
    custom?.registryNote ? `REGISTER: ${custom.registryNote}` : '',
    culturalContext ? `CULTURE: ${culturalContext}` : '',
    custom?.tone ? `TONE: ${custom.tone}` : '',
    custom?.userGoal ? `USER GOAL: ${custom.userGoal}` : '',
  ].filter(Boolean)
  const enrichedSetting = enrichmentLines.length
    ? `${custom?.setting || ''}\n\n${enrichmentLines.join('\n')}`
    : custom?.setting || ''

  return {
    id: custom?.id || `custom_${Date.now()}`,
    title: custom?.title || 'Your Scenario',
    titleJP: custom?.titleJP || 'カスタム',
    description: custom?.description || '',
    emoji: custom?.emoji || '✨',
    difficulty: custom?.difficulty || 'intermediate',
    estimatedMinutes: custom?.estimatedMinutes || 5,
    color: '#1B4F8A',
    character: {
      name: character.name || 'Custom Character',
      nameJP: character.nameJP || 'カスタム',
      description: character.description || '',
      personality: character.personality || '',
      speechStyle: character.speechStyle || '',
      relationship: character.relationship || '',
      avatar: character.avatar || '/characters/custom.png',
      voiceId: character.voiceId || 'JOcmGzB8OFjY8MhjHHEf',
    },
    setting: enrichedSetting,
    settingJP: custom?.settingJP || '',
    openingLine: custom?.openingLine || '',
    openingLineEN: custom?.openingLineEN || '',
    culturalNotes: Array.isArray(custom?.culturalContext) ? custom.culturalContext : [],
    tweaks: [],
  }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { scenarioId, customPrompt, customScenario, userProfile }: any =
      await request.json()

    if (!scenarioId && !customScenario) {
      return Response.json({ error: 'scenarioId is required' }, { status: 400 })
    }

    const { userId: clerkUserId2 } = auth()

    // ── SESSION LIMITS ─────────────────────────────────────────────────
    // Premade scenarios: only 1 active (non-complete, non-abandoned) session
    // per scenario. If one exists, return it instead of creating a new one.
    // Custom scenarios: max 3 active at a time.
    if (clerkUserId2 && process.env.DATABASE_URL) {
      const { neon: neonCheck } = await import('@neondatabase/serverless')
      const sqlCheck = neonCheck(process.env.DATABASE_URL)

      const isCustom = !!(customScenario || (typeof scenarioId === 'string' && scenarioId.startsWith('custom_')))

      if (isCustom) {
        // Custom: max 3 active sessions
        const activeCustom = await sqlCheck`
          SELECT COUNT(*) AS count FROM loop_sessions
          WHERE (user_id = ${clerkUserId2} OR user_id IS NULL)
            AND scenario_id LIKE 'custom_%'
            AND phase != 'complete'
            AND is_abandoned = false
        `
        const customCount = parseInt((activeCustom[0] as { count: string })?.count || '0', 10)
        if (customCount >= 3) {
          return Response.json({
            error: 'limit_reached',
            message: 'You can have up to 3 custom conversations at a time. Complete or delete one to start a new one.',
          }, { status: 429 })
        }
      } else if (scenarioId && scenarioId !== 'custom') {
        // Premade: check for existing active session
        const existing = await sqlCheck`
          SELECT id FROM loop_sessions
          WHERE (user_id = ${clerkUserId2} OR user_id IS NULL)
            AND scenario_id = ${scenarioId}
            AND phase != 'complete'
            AND is_abandoned = false
          ORDER BY last_active_at DESC
          LIMIT 1
        `
        if (existing.length > 0) {
          // Return existing session instead of creating a new one
          return Response.json({
            sessionId: (existing[0] as { id: string }).id,
            resumed: true,
          })
        }
      }
    }

    // Determine the loop mode from the learner's experience level.
    // Beginner (1-2): Experience → Learn → Recognize (no failure)
    // Elementary (3-4): Attempt with training wheels → Learn → Retry
    // Intermediate+ (5+): full Attempt → Fail → Learn → Retry
    const experience: number =
      typeof userProfile?.experience === 'number' ? userProfile.experience : 5
    const loopMode: 'beginner' | 'elementary' | 'intermediate' =
      experience <= 2 ? 'beginner' : experience <= 4 ? 'elementary' : 'intermediate'

    // Resolve the scenario from one of three sources, in priority order:
    //   1. customScenario object passed inline (fresh AI generation)
    //   2. scenarioId starting with `custom_` → fetch saved scenario from DB
    //   3. scenarioId matching a SCENARIO_TEMPLATES preset
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scenario: any = null

    if (customScenario && typeof customScenario === 'object') {
      scenario = customScenarioToTemplate(customScenario)
    } else if (
      typeof scenarioId === 'string' &&
      scenarioId.startsWith('custom_') &&
      process.env.DATABASE_URL
    ) {
      try {
        const { neon } = await import('@neondatabase/serverless')
        const sqlLookup = neon(process.env.DATABASE_URL!)
        const rows = (await sqlLookup`
          SELECT scenario_data FROM custom_scenarios WHERE id = ${scenarioId} LIMIT 1
        `) as Array<{ scenario_data: unknown }>
        if (rows[0]?.scenario_data) {
          scenario = customScenarioToTemplate(rows[0].scenario_data)
          // Bump play count
          await sqlLookup`
            UPDATE custom_scenarios
            SET times_played = times_played + 1, last_played_at = NOW()
            WHERE id = ${scenarioId}
          `
        }
      } catch (lookupErr) {
        console.error('Custom scenario lookup failed:', lookupErr)
      }
    }

    if (!scenario) {
      scenario = getScenarioById(scenarioId)
    }

    if (!scenario) {
      return Response.json({ error: `Scenario "${scenarioId}" not found` }, { status: 404 })
    }

    const sessionId = `loop_${Date.now()}`
    const { userId: clerkUserId } = auth()
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
      userProfile,
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

    // For inline custom scenarios, use the scenario's own id rather than
    // whatever the client sent in scenarioId.
    const effectiveScenarioId: string = scenario?.id || scenarioId

    const sessionData = {
      id: sessionId,
      scenarioId: effectiveScenarioId,
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
      loopMode,
      userExperienceLevel: experience,
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
            id, user_id, scenario_id, scenario_title, scenario_title_jp, scenario_emoji,
            character_name, character_name_jp, character_color, character_avatar,
            character_description, character_personality, character_speech_style,
            character_relationship, voice_id, setting, opening_line,
            phase, loop_mode, user_experience_level,
            attempt_messages, retry_messages,
            diagnosis, learn_blocks, milestone_card,
            created_at
          )
          VALUES (
            ${sessionId}, ${clerkUserId || null}, ${effectiveScenarioId}, ${scenarioTitle}, ${scenarioTitleJP}, ${scenarioEmoji},
            ${characterName}, ${characterNameJP}, ${characterColor}, ${characterAvatar},
            ${characterDescription}, ${characterPersonality}, ${characterSpeechStyle},
            ${characterRelationship}, ${voiceId}, ${setting}, ${openingLine},
            'attempt', ${loopMode}, ${experience},
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
  userProfile?: UserProfilePayload | null
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
  } = opts

  const profileContext = buildProfileContext(userProfile)
  const level = typeof userProfile?.experience === 'number' ? userProfile.experience : 5
  const adaptiveRules = levelAdaptiveRules(level)

  return `You are playing a character in a Japanese language learning conversation simulator (Loop mode — Attempt phase).

${profileContext ? `LEARNER PROFILE:\n${profileContext}\n\n` : ''}${adaptiveRules}
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
13a. CRITICAL — NEVER end your turn on a pure acknowledgment OR a pure greeting. If your natural reaction would be a one-line ack like "good choice", "okay", "got it", "わかった", "了解(りょうかい)", "いいね", "はい" — DO NOT stop there. In the SAME message, immediately chain into the next conversation beat from the SETTING's CONVERSATION FLOW (or, if no flow is defined, the next natural step in the scenario). Every message must end with a CONCRETE QUESTION OR REQUEST the learner can directly answer. Examples of acceptable endings: "what'll you have?", "how firm do you want the noodles?", "that'll be 800 yen", "where are you from?". Examples of UNACCEPTABLE endings: "welcome!", "have a seat!", "sit anywhere!", "good choice!" — these give the learner nothing to respond to.
13b. OPENING MESSAGE — your VERY FIRST message in the conversation MUST follow rule 13a even more strictly. After greeting the learner, in the SAME message, ask the FIRST question of the scenario. For a ramen shop the opening must end with the equivalent of "what'll you have today?" / 何(なに)にしますか？ — never just "welcome, sit down". The learner should be able to answer your opening message with a concrete order/preference/request immediately.
14. If the learner writes in ${nativeLanguage}, gently respond in ${targetLanguage} and the coach note should say "Try responding in Japanese next time!"
15. After ---COACH---, always add ---OPTIONS--- followed by exactly 4 response options the learner could say next.
Each option MUST include furigana for all kanji in the same format: 漢字(かんじ).
Each option format: [Japanese with furigana] | [romaji] | [English] | [safe/natural/bold/funny]
Option 1: safest, most polite response
Option 2: natural, normal response
Option 3: bold or casual response
Option 4: funny or unexpected response
All options must be grammatically correct Japanese at the learner's level.
16. After all the above sections, if the learner is a beginner (level 1-4 — assume beginner if no profile is shown), add ---HINTS--- on its own line followed by 3-6 short ENGLISH chip ideas, ONE per line. Format each line as either:
    [short english phrase]
    or
    [short english phrase] | [short hint in parentheses]
    Examples for a ramen shop after asking "what'll you have?":
      tonkotsu (rich pork broth)
      shoyu (soy sauce)
      shio (salt — lighter)
      with extra chashu
      no green onions
    The chips should be plausible English answers to the QUESTION you just asked the learner. Each chip UNDER 6 words, plain ENGLISH (the parenthetical hint is also English). Do NOT translate to Japanese. ALWAYS emit HINTS on the OPENING message in beginner mode — the learner needs the most help on turn 1. Only skip HINTS for the closing/farewell beat where the conversation is wrapping up.`
}
