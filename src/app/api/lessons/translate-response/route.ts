import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { buildProfileContext, type UserProfilePayload } from '@/lib/userProfileContext'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const {
      userEnglish,
      characterLine,
      characterLineEN,
      setting,
      characterName,
      previousExchanges,
      userProfile,
    }: {
      userEnglish: string
      characterLine: string
      characterLineEN: string
      setting: string
      characterName: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      previousExchanges: any[]
      userProfile?: UserProfilePayload | null
    } = await req.json()

    const profileContext = buildProfileContext(userProfile)

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `You are a Japanese language teacher helping a learner.

${profileContext ? `LEARNER PROFILE:\n${profileContext}\n\n` : ''}Setting: ${setting}
${characterName} just said: 「${characterLine}」("${characterLineEN}")

Previous exchanges:
${(previousExchanges || [])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ex: any) =>
      `${characterName}: ${ex.characterLine}\nLearner said: ${ex.userJP} ("${ex.userEN}")`,
  )
  .join('\n')}

The learner wants to say (in English): "${userEnglish}"

Translate this into natural Japanese that fits:
1. The setting and relationship
2. The learner's age and gender (as above)
3. The learner's current level (as above — simpler for beginners)

Return ONLY valid JSON (no markdown fences, no commentary):
{
  "japanese": "the natural Japanese translation",
  "reading": "full hiragana reading of the Japanese",
  "romaji": "romaji transliteration",
  "breakdown": [
    {
      "chunk": "word or phrase",
      "reading": "hiragana",
      "meaning": "English meaning",
      "note": "optional grammar note — only if genuinely interesting/important"
    }
  ],
  "naturalness": "one sentence on why this phrasing fits this person in this situation",
  "alternativePhrase": "optional — a simpler or more common alternative if exists",
  "alternativePhraseEN": "English explanation of the alternative"
}`,
        },
      ],
    })

    const text = res.content[0].type === 'text' ? res.content[0].text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const translation = JSON.parse(cleaned)
    return NextResponse.json({ translation })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Translation failed'
    console.error('translate-response error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
