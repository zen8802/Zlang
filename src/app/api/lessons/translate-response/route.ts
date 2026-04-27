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

    const lvl = typeof userProfile?.experience === 'number' ? userProfile.experience : 5
    const beginnerRules = lvl <= 4 ? `

RULES FOR BEGINNER TRANSLATION (level 1-4):

1. OUTPUT IN KANA FIRST
   Prefer hiragana and katakana over kanji in the "japanese" field.
   Wrong: 日曜日に来ます
   Right: にちようびに きます
   The user must be able to TYPE this, and they only know kana.

2. NATURAL SPEECH FIRST
   Translate what the learner ACTUALLY wants to say, not a dumbed-down version.
   Use the grammar and vocabulary that a real Japanese speaker would use in this situation.
   Keep it at the learner's level, but DO NOT sacrifice naturalness for simplicity.

   BAD (overly simplified): にちようび。ぎょうざ。たべます。
   GOOD (natural but simple): にちようびに ぎょうざを たべに きます

   The goal is: "I said something REAL" not "I said something robotic."

3. GRAMMAR GUIDANCE (not restrictions)
   Level 1-2: prefer ます/です forms, particles は/が/を/に/で
   Level 3-4: add て-form, たい, から, けど
   AVOID: passive, causative, conditionals — but DO use natural particle chains
   and common adverbs (また, もう, まだ, ちょっと, etc.)

4. DO NOT SPLIT UNNECESSARILY
   If the thought is one sentence in Japanese, keep it as one sentence.
   Only split if a Japanese speaker would naturally use two sentences.

5. THE BREAKDOWN
   Each chunk's "chunk" field should be the kana form.
   If the word has a kanji form worth knowing, put it in the "note":
   "also written as 日曜日"
` : ''

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `You are a Japanese language teacher helping a learner.

${profileContext ? `LEARNER PROFILE:\n${profileContext}\n${beginnerRules}\n` : `${beginnerRules}\n`}Setting: ${setting}
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

Translate this into natural, conversational Japanese that a real person would say in this situation.
Priority order:
1. NATURALNESS — would a Japanese person actually say this? If not, rephrase.
2. The setting and relationship (casual/polite register)
3. The learner's level — keep grammar accessible, but NEVER dumb down the phrasing into robotic fragments. A beginner can learn a natural sentence.

Return ONLY valid JSON (no markdown fences, no commentary):
{
  "japanese": "the natural Japanese translation",
  "reading": "full hiragana reading of the Japanese",
  "romaji": "romaji transliteration",
  "breakdown": [
    {
      "chunk": "word or phrase as it appears in the japanese sentence (kana or kana+kanji)",
      "reading": "the hiragana reading of just this chunk",
      "romaji": "the romaji transliteration of just this chunk (REQUIRED — never omit)",
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
