import Anthropic from '@anthropic-ai/sdk'
import { SCENARIO_TEMPLATES, CHARACTER_ROSTER } from '@/data/scenarios'

function getScenarioById(id: string) {
  return SCENARIO_TEMPLATES.find(s => s.id === id) || null
}

function resolveVoiceId(scenario: ReturnType<typeof getScenarioById>, tweakValues: Record<string, string>): string {
  if (scenario?.id === 'custom' && tweakValues['character-select']) {
    const selected = tweakValues['character-select'].toLowerCase()
    const match = CHARACTER_ROSTER.find(c => selected.includes(c.name.toLowerCase()))
    if (match) return match.voiceId
  }
  return scenario?.character.voiceId || 'JOcmGzB8OFjY8MhjHHEf'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSystemPrompt(scenario: any, tweakValues: Record<string, any>, targetLanguage: string, nativeLanguage: string, userLevel: string): string {
  const { character, setting } = scenario

  // Resolve tweak prompt injections
  const tweakLines: string[] = []
  if (scenario.tweaks) {
    for (const tweak of scenario.tweaks) {
      const val = tweakValues[tweak.id]
      if (val !== undefined && val !== 'false' && val !== '') {
        // promptInjection is a string template with {value} placeholder
        const injection = typeof tweak.promptInjection === 'function'
          ? tweak.promptInjection(val)
          : tweak.promptInjection.replace(/\{value\}/g, String(val))
        if (injection) tweakLines.push(`- ${injection}`)
      }
    }
  }

  return `You are playing a character in a Japanese language learning conversation simulator.

CHARACTER: ${character.name} (${character.nameJP})
${character.description}
Personality: ${character.personality}
Speech style: ${character.speechStyle}

SETTING: ${setting}

RELATIONSHIP: ${character.relationship}

THE LEARNER:
- Native language: ${nativeLanguage}
- Target language: ${targetLanguage} (this is what they're learning)
- Level: ${userLevel}

TWEAKS APPLIED:
${tweakLines.length > 0 ? tweakLines.join('\n') : '- None'}

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
10. Then add "---COACH---" with ONE concise cultural fact in ${nativeLanguage}. MAX 1 sentence. Must be a specific, concrete fact — a date, a number, a rule, an origin story, a social norm. NO flowery descriptions, NO "the theater of ramen", NO vague atmosphere descriptions. Good: "Tonkotsu broth takes 12+ hours to make — ordering 替え玉(かえだま) (extra noodles) shows you respect that effort." Bad: "The sounds and smells of a ramen shop create an amazing atmosphere!" Include any relevant Japanese words with furigana: 漢字(かんじ) format.
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

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { scenarioId, tweakValues = {}, targetLanguage = 'Japanese', nativeLanguage = 'English', userLevel = 'beginner' } = await request.json()

    const scenario = getScenarioById(scenarioId)
    if (!scenario) {
      return Response.json({ error: `Scenario "${scenarioId}" not found` }, { status: 404 })
    }

    const sessionId = `session_${Date.now()}`
    const systemPrompt = buildSystemPrompt(scenario, tweakValues, targetLanguage, nativeLanguage, userLevel)

    // Generate the opening message via Claude so it respects tweaks and level
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const opening = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `[SYSTEM: The conversation is starting now. Deliver your opening line as ${scenario.character.name}. Stay in character. This is the very first message the learner sees — greet them naturally according to the scenario. Include the ---COACH--- section.]`,
        },
      ],
    })

    const openingMessage =
      opening.content[0].type === 'text' ? opening.content[0].text : ''

    // Persist to DB if available
    if (process.env.DATABASE_URL) {
      try {
        const { neon } = await import('@neondatabase/serverless')
        const sql = neon(process.env.DATABASE_URL)
        await sql`
          INSERT INTO studio_sessions (id, scenario_id, scenario_title, character_name, character_description, setting, target_language, native_language, user_level, messages, created_at)
          VALUES (
            ${sessionId},
            ${scenarioId},
            ${scenario.title},
            ${scenario.character.name},
            ${scenario.character.description},
            ${scenario.setting},
            ${targetLanguage},
            ${nativeLanguage},
            ${userLevel},
            ${JSON.stringify([
              { role: 'assistant', content: openingMessage },
            ])}::jsonb,
            NOW()
          )
        `
      } catch (dbError) {
        // Log but don't fail — session can still work without persistence
        console.error('Failed to save studio session to DB:', dbError)
      }
    }

    return Response.json({
      sessionId,
      openingMessage,
      characterName: `${scenario.character.name} (${scenario.character.nameJP})`,
      characterAvatar: scenario.character.avatar,
      voiceId: resolveVoiceId(scenario, tweakValues),
      characterDescription: scenario.character.description,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
