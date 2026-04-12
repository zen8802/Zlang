import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { userDescription, userProfile } = await req.json()

    if (!userDescription?.trim()) {
      return NextResponse.json(
        { error: 'No description provided' },
        { status: 400 },
      )
    }

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are a Japanese language learning scenario designer with deep knowledge of Japanese culture, social dynamics, and language.

A learner described this situation they want to practice:
"${userDescription}"

Learner profile:
- Experience level: ${userProfile?.experience || 3}/10
- Age: ${userProfile?.age || 25}
- Gender: ${userProfile?.gender || 'other'}
- Native language: ${userProfile?.direction === 'jp-to-en' ? 'Japanese' : 'English'}

Design a complete conversation scenario for this learner. Make it feel like a real situation they would actually face.

Consider:
1. What is the social relationship between the characters?
2. What are the stakes of this conversation?
3. What would a real Japanese person in this role be like?
4. What cultural dynamics are at play?
5. What vocabulary domain does this naturally involve?
6. What register (casual/polite/formal/keigo) is appropriate?

Return ONLY valid JSON (no markdown fences, no commentary):
{
  "title": "short evocative title (3-5 words)",
  "titleJP": "Japanese title",
  "description": "one sentence — the situation as it actually feels",
  "emoji": "one fitting emoji for the scenario",

  "character": {
    "name": "a real Japanese name appropriate for this character",
    "nameJP": "name in kanji/kana",
    "description": "one sentence — who this person is",
    "personality": "how they actually behave in this situation",
    "speechStyle": "specific description of their Japanese speech patterns",
    "relationship": "their relationship to the learner",
    "age": "approximate age range",
    "gender": "male/female/ambiguous"
  },

  "setting": "one sentence — the physical and social setting",
  "settingJP": "setting in Japanese",

  "culturalContext": [
    "specific cultural dynamic the learner needs to know",
    "another cultural note relevant to this exact situation"
  ],

  "difficulty": "beginner|intermediate|advanced",
  "estimatedMinutes": 5,

  "vocabularyDomain": "which vocabulary domain this naturally involves (food/grammar/social/transport/work/body/culture/nature/numbers/daily-life)",
  "expectedVocabulary": [
    "Japanese word that would naturally appear in this conversation",
    "another natural word"
  ],

  "openingLine": "the first thing the character says in Japanese (with furigana for kanji: 漢字(かんじ) format)",
  "openingLineEN": "English translation of opening line",

  "userGoal": "what success looks like in this conversation",
  "dramaticQuestion": "the underlying tension — what makes this hard",
  "tone": "casual|warm|tense|formal|playful|awkward",
  "culturalTrap": "the most common cultural mistake learners make here",
  "registryNote": "specific note on keigo/politeness level and why"
}`,
        },
      ],
    })

    const text = res.content[0].type === 'text' ? res.content[0].text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scenario: any
    try {
      scenario = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse scenario JSON:', cleaned.substring(0, 500))
      return NextResponse.json(
        { error: 'Generation produced invalid JSON' },
        { status: 502 },
      )
    }

    // Stamp the ID server-side so the client can't forge it
    scenario.id = `custom_${Date.now()}`

    // Persist for replay if we have a user
    const { userId } = auth()
    if (userId && process.env.DATABASE_URL) {
      try {
        const { neon } = await import('@neondatabase/serverless')
        const sql = neon(process.env.DATABASE_URL)
        await sql`
          INSERT INTO custom_scenarios (
            id, user_id, title, scenario_data,
            user_description, created_at
          ) VALUES (
            ${scenario.id},
            ${userId},
            ${scenario.title || 'Custom Scenario'},
            ${JSON.stringify(scenario)}::jsonb,
            ${userDescription},
            NOW()
          )
        `
      } catch (dbErr) {
        console.error('Failed to save custom scenario:', dbErr)
      }
    }

    return NextResponse.json({ scenario })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    console.error('Scenario generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
