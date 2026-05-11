import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { buildProfileContext, type UserProfilePayload } from '@/lib/userProfileContext'
import { getUserKanjiLevel } from '@/lib/user-level'

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
    const { userId } = auth()
    const { constraint: kanjiConstraint } = await getUserKanjiLevel(userId || '')

    const lvl = typeof userProfile?.experience === 'number' ? userProfile.experience : 5
    const beginnerRules = lvl <= 4 ? `

RULES FOR BEGINNER TRANSLATION (level 1-4):

1. USE REAL JAPANESE SCRIPT
   ${kanjiConstraint}

   The constraint above applies to the "japanese" field, each chunk's "chunk"
   field, and any other Japanese rendered to the learner.
   Use katakana for loanwords: ビール not びーる, ラーメン not らーめん.

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

    // Match the translated Japanese against vocabulary_cards to find NEW
    // lesson-eligible words. A word counts as "new" if:
    //   - its `word` or `reading` substring appears in the translation, AND
    //   - the user has NOT already marked it as status='learned'.
    // Particles and 1-char readings are skipped to avoid noise.
    const newWordIds = await findNewWordIds(translation, userId)

    return NextResponse.json({ translation, newWordIds })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Translation failed'
    console.error('translate-response error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Identify vocabulary_cards rows that appear in the translated Japanese
 * but are not yet status='learned' for this user. Returns an ordered, deduped
 * list of card IDs. Safe to call without DB (returns []).
 *
 * Matching strategy: strip furigana annotations from the Japanese, then look
 * for each card's `word` or `reading` as a substring. Long words first, so
 * longer matches win over shorter ones. Skip standalone particles.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findNewWordIds(translation: any, userId: string | null): Promise<string[]> {
  if (!process.env.DATABASE_URL) return []
  if (!translation?.japanese) return []

  // Gather candidate text from the translation: the main Japanese line plus
  // each breakdown chunk. The breakdown is where most useful word boundaries
  // are already isolated by the model.
  const stripFuri = (s: string) => s.replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')
  const chunks: string[] = []
  chunks.push(stripFuri(translation.japanese))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (Array.isArray(translation.breakdown)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const b of translation.breakdown) {
      if (b?.chunk) chunks.push(stripFuri(b.chunk))
    }
  }

  const haystack = chunks.join('\n')

  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)

    // Fetch a small candidate pool — words whose `word` or `reading` appears
    // anywhere in the haystack. We do the actual substring match in JS so
    // we can apply word-length filtering and preferred-form rules.
    //
    // Using `position(... in ...)` directly across the table would scan all
    // ~thousands of rows on every call; instead we let Postgres filter via
    // a join on a values table built from the unique substrings of the
    // haystack — but the haystack is short, so a simple full-table scan
    // with the substring filter is acceptable here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (await sql`
      SELECT id, word, reading FROM vocabulary_cards
      WHERE position(word IN ${haystack}) > 0
         OR position(reading IN ${haystack}) > 0
    `) as { id: string; word: string; reading: string }[]

    // Exclude particles / 1-char hiragana-only matches.
    const PARTICLE_SET = new Set(['は', 'を', 'が', 'に', 'で', 'と', 'も', 'へ', 'の', 'や', 'か'])
    const candidates = rows.filter((r) => {
      const w = r.word || ''
      const reading = r.reading || ''
      if (PARTICLE_SET.has(w) || PARTICLE_SET.has(reading)) return false
      // Require at least 2 chars in either form — too many 1-char false positives.
      if (w.length < 2 && reading.length < 2) return false
      return true
    })

    if (candidates.length === 0) return []

    // Filter out words already marked learned. Skip this for anonymous users.
    let alreadyLearned = new Set<string>()
    if (userId) {
      const ids = candidates.map((c) => c.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const learnedRows = (await sql`
        SELECT card_id FROM user_cards
        WHERE user_id = ${userId}
          AND status = 'learned'
          AND card_id = ANY(${ids}::text[])
      `) as { card_id: string }[]
      alreadyLearned = new Set(learnedRows.map((r) => r.card_id))
    }

    // Order: longer words first (so 注文 beats 文), then preserve DB order.
    const ranked = candidates
      .filter((c) => !alreadyLearned.has(c.id))
      .sort((a, b) => (b.word?.length ?? 0) - (a.word?.length ?? 0))

    // Dedupe by id.
    const seen = new Set<string>()
    const out: string[] = []
    for (const c of ranked) {
      if (!seen.has(c.id)) {
        seen.add(c.id)
        out.push(c.id)
      }
    }
    return out
  } catch (err) {
    console.error('findNewWordIds error:', err)
    return []
  }
}
