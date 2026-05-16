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
   Level 1-2 baseline: は/が/を/に/で particles, simple connectors
   Level 3-4: add て-form, たい, から, けど
   AVOID: passive, causative, conditionals — but DO use natural particle chains
   and common adverbs (また, もう, まだ, ちょっと, etc.)

4. DO NOT SPLIT UNNECESSARILY
   If the thought is one sentence in Japanese, keep it as one sentence.
   Only split if a Japanese speaker would naturally use two sentences.

5. ⚠️ REGISTER — MATCH THE CONVERSATION, NOT THE LEVEL ⚠️
   Read the most recent character lines and the previous exchanges before
   you pick a register. Mirror what's actually happening.

   - If the character has been speaking in casual/plain form (です/ます absent,
     short-form verbs like 行く・食べる, sentence-final だ/だよ/だね, particles
     よ/ね/な, contractions like じゃない, slang, banter, sports talk, friends'
     speech) → REPLY IN CASUAL FORM. だ not です, plain verb forms not ます.
   - If the character is in clear polite mode (shopkeeper, stranger, ですます
     throughout, honorifics) → reply in です/ます.
   - If MIXED / ambiguous → match the most recent character utterance.
   - Defaulting to です/ます when the conversation is clearly casual is WRONG
     and will be flagged. Being too polite for banter feels stiff and
     uncomfortable, the same way switching to legalese mid-joke would in English.

   Examples:
     Character: "おう、来た来た！マンU見る？"  (casual banter)
       BAD:  インドです     (polite — kills the vibe)
       GOOD: インドだよ     (casual — keeps the banter)
       GOOD: インド          (one-word casual reply is fine)

     Character: "いらっしゃいませ。ご注文は？"  (polite service)
       GOOD: ラーメンをください     (polite request)
       BAD:  ラーメンちょうだい    (too casual for a stranger)

   Mention the chosen register briefly in "naturalness" so the learner sees why.

6. THE BREAKDOWN
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
2. REGISTER — match the character's actual speech style (casual/plain vs polite ですます).
   Look at the lines above. If they've been bantering in plain form, do NOT switch
   the learner to です/ます. Mirror the conversation; don't default to politeness.
3. The setting and relationship.
4. The learner's level — keep grammar accessible, but NEVER dumb down the phrasing into robotic fragments. A beginner can learn a natural sentence.

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

    // Pull lesson-eligible words directly from the AI's breakdown. This sidesteps
    // the vocabulary_cards seed table — every meaningful chunk the model identified
    // is a candidate. Words the user already learned (via lessons OR the kanji
    // collection) are filtered out.
    const newWords = await extractNewLessonWords(translation, userId)

    // Back-compat alias: callers that still read `newWordIds` get the keys.
    const newWordIds = newWords.map((w) => w.key)

    return NextResponse.json({ translation, newWords, newWordIds })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Translation failed'
    console.error('translate-response error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export interface LessonWord {
  key: string // stable dedup key — the reading (or the chunk if reading missing)
  word: string // surface form, may include furigana 漢字(かんじ)
  reading: string
  romaji: string
  english: string
  partOfSpeech: string
  note?: string
}

const stripFuri = (s: string) =>
  (s || '').replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')

// Common particles / fragments that should never become lesson words.
// Multi-char particles included so they're caught even when not isolated.
const SKIP_FORMS = new Set([
  'は', 'を', 'が', 'に', 'で', 'と', 'も', 'へ', 'の', 'や', 'か',
  'です', 'だ', 'ます', 'ました', 'ません',
  'ね', 'よ', 'な', 'ぞ', 'ぜ', 'わ',
  'から', 'まで', 'より',
])

/**
 * Walk the AI's breakdown and emit lesson-word candidates. Drops:
 *   - particles, auxiliaries, sentence-final markers
 *   - chunks shorter than 2 chars in both surface and reading form
 *   - words the user already learned via lessons
 *   - single-kanji words whose kanji is in the user's discovered_kanji set
 *     (treats kanji-collection learning as covering the word)
 *   - duplicates within this batch (deduped by reading)
 *
 * Returns objects so the lesson generator can build prompts without a
 * vocabulary_cards lookup.
 */
async function extractNewLessonWords(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translation: any,
  userId: string | null,
): Promise<LessonWord[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breakdown: any[] = Array.isArray(translation?.breakdown) ? translation.breakdown : []
  if (breakdown.length === 0) return []

  const candidates: LessonWord[] = []
  const seenKeys = new Set<string>()

  for (const b of breakdown) {
    const chunkRaw: string = b?.chunk || ''
    const reading: string = b?.reading || ''
    const surface = stripFuri(chunkRaw)
    const key = (reading || surface).trim()
    const english: string = (b?.meaning || '').trim()

    if (!key) continue
    if (seenKeys.has(key)) continue
    if (SKIP_FORMS.has(surface) || SKIP_FORMS.has(reading)) continue
    if (surface.length < 2 && reading.length < 2) continue
    if (!english) continue

    seenKeys.add(key)
    candidates.push({
      key,
      word: chunkRaw,
      reading,
      romaji: b?.romaji || '',
      english,
      partOfSpeech: derivePOS(b?.note),
      note: b?.note,
    })
  }

  if (candidates.length === 0) return []

  // Apply "already known" filters: words that are in learned_words for this
  // user, plus single-kanji words covered by the kanji collection.
  if (userId && process.env.DATABASE_URL) {
    try {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL)

      // learned_words check — match by japanese OR reading
      const keysAndSurfaces = Array.from(
        new Set(candidates.flatMap((c) => [c.key, stripFuri(c.word)])),
      )
      const learnedRows = (await sql`
        SELECT japanese, reading
        FROM learned_words
        WHERE user_id = ${userId}
          AND (
            japanese = ANY(${keysAndSurfaces}::text[])
            OR reading = ANY(${keysAndSurfaces}::text[])
          )
      `) as { japanese: string; reading: string }[]
      const alreadyLearned = new Set<string>()
      for (const r of learnedRows) {
        if (r.japanese) alreadyLearned.add(stripFuri(r.japanese))
        if (r.reading) alreadyLearned.add(r.reading)
      }

      // kanji collection check — discovered_kanji on users
      const discoveredRows = (await sql`
        SELECT discovered_kanji FROM users WHERE clerk_id = ${userId}
      `) as { discovered_kanji: string[] | null }[]
      const discoveredKanji = new Set<string>(discoveredRows[0]?.discovered_kanji || [])

      return candidates.filter((c) => {
        if (alreadyLearned.has(c.key)) return false
        if (alreadyLearned.has(stripFuri(c.word))) return false
        // Single-kanji word fully covered by the kanji collection.
        const surface = stripFuri(c.word)
        if (surface.length === 1 && discoveredKanji.has(surface)) return false
        return true
      })
    } catch (err) {
      console.error('extractNewLessonWords filter error:', err)
      // On filter error, return raw candidates rather than blocking the feature.
      return candidates
    }
  }

  return candidates
}

function derivePOS(note: string | undefined | null): string {
  if (!note) return 'word'
  const n = note.toLowerCase()
  if (n.includes('verb')) return 'verb'
  if (n.includes('adjective')) return 'adjective'
  if (n.includes('adverb')) return 'adverb'
  if (n.includes('particle')) return 'particle'
  if (n.includes('phrase') || n.includes('expression')) return 'expression'
  if (n.includes('noun')) return 'noun'
  return 'word'
}

