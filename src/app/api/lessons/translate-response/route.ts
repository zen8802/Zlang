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

1. USE REAL JAPANESE SCRIPT
   Write the japanese field the way a native would write it.
   - USE katakana for loanwords: ビール not びーる, ラーメン not らーめん
   - USE these Grade 1 kanji freely: 一二三四五六七八九十日月火水木金土山川田人口目耳手足力大小中上下左右本文字学校先生気天空雨花草虫犬車糸林森正王玉石竹米見音年早名白赤青円入出立休子女男貝
   - For kanji NOT in that list, write in hiragana (e.g. 食べる → たべる)
   - Add furigana for the Grade 1 kanji in the breakdown notes

   CORRECT: ビールと水をおねがいします
   WRONG:   びーるとみずをおねがいします

2. NATURAL SPEECH FIRST
   Translate what the learner ACTUALLY wants to say, not a dumbed-down version.
   Use the grammar and vocabulary that a real Japanese speaker would use in this situation.
   Keep it at the learner's level, but DO NOT sacrifice naturalness for simplicity.

   BAD (robotic): 日よう日。ぎょうざ。たべます。
   GOOD (natural): 日よう日にぎょうざをたべにきます

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
   Each chunk's "chunk" field should match how it appears in the japanese field.
   Include reading and romaji for every chunk.
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
  "romaji": "romaji with macrons for long vowels (ō ū ē ā). Example: bēkon not beekon, rāmen not raamen",
  "breakdown": [
    {
      "chunk": "word or phrase as it appears in the japanese sentence (kana or kana+kanji)",
      "reading": "the hiragana reading of just this chunk",
      "romaji": "romaji with macrons for long vowels (ō ū ē ā) — REQUIRED, never omit",
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
