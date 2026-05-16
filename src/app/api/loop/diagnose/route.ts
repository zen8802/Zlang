import Anthropic from '@anthropic-ai/sdk'
import { buildKanjiConstraint, getLevelKanjiSet } from '@/data/kanji-levels'

/**
 * /api/loop/diagnose
 *
 * Lesson generator. Replaces the old open-ended diagnosis with a FIXED
 * four-block template (encounter → recognition_quiz → sentence_build →
 * conversation_replay). Claude only fills in content, never decides
 * structure. The list of words to teach comes from `lessonWordIds`,
 * gathered during the conversation phase.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enforceLevelKanji(text: string, kanjiLevel: number): string {
  if (!text || typeof text !== 'string') return text
  const allowed = getLevelKanjiSet(kanjiLevel)
  return text.replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, (match, block: string, reading: string) => {
    for (const ch of block) {
      if (!allowed.has(ch)) return reading
    }
    return match
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanLesson(lesson: any, kanjiLevel: number): any {
  if (!lesson) return lesson
  const enforce = (s: string) => enforceLevelKanji(s, kanjiLevel)

  if (Array.isArray(lesson.learnBlocks)) {
    for (const block of lesson.learnBlocks) {
      if (!block) continue
      if (block.type === 'encounter' && Array.isArray(block.words)) {
        for (const w of block.words) {
          if (w.word) w.word = enforce(w.word)
          if (w.contextSentenceJP) w.contextSentenceJP = enforce(w.contextSentenceJP)
        }
      } else if (block.type === 'recognition_quiz' && Array.isArray(block.questions)) {
        for (const q of block.questions) {
          if (q.wordJP) q.wordJP = enforce(q.wordJP)
        }
      } else if (block.type === 'sentence_build') {
        if (block.targetSentenceJP) block.targetSentenceJP = enforce(block.targetSentenceJP)
        if (Array.isArray(block.tiles)) {
          block.tiles = block.tiles.map((t: string) => enforce(t))
        }
        if (Array.isArray(block.correctTiles)) {
          block.correctTiles = block.correctTiles.map((t: string) => enforce(t))
        }
      } else if (block.type === 'conversation_replay') {
        if (block.characterLine) block.characterLine = enforce(block.characterLine)
        if (block.userResponseJP) block.userResponseJP = enforce(block.userResponseJP)
        if (block.blankWord) block.blankWord = enforce(block.blankWord)
        if (Array.isArray(block.options)) {
          block.options = block.options.map((o: string) => enforce(o))
        }
      }
    }
  }
  return lesson
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    interface IncomingLessonWord {
      key?: string
      word?: string
      reading?: string
      romaji?: string
      english?: string
      partOfSpeech?: string
      note?: string
    }
    const {
      sessionId,
      messages,
      lessonWords: passedWords,
    }: {
      sessionId: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: any[]
      lessonWords?: IncomingLessonWord[]
    } = await request.json()

    if (!sessionId) {
      return Response.json({ error: 'sessionId is required' }, { status: 400 })
    }
    if (!messages || !Array.isArray(messages) || messages.length < 2) {
      return Response.json({ error: 'At least 2 messages are required' }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      return Response.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
    }

    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL!)

    // Load session metadata (character name, kanji level)
    const sessionRows = (await sql`
      SELECT character_name, kanji_level
      FROM loop_sessions
      WHERE id = ${sessionId}
      LIMIT 1
    `) as { character_name: string; kanji_level: number | null }[]

    if (sessionRows.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 })
    }
    const session = sessionRows[0]
    const kanjiLevel = session.kanji_level ?? 1
    const characterName = session.character_name || 'Character'

    // Lesson words come straight from the client now — built from the AI's
    // breakdown chunks during the conversation. No vocabulary_cards lookup.
    const wordRows = (passedWords || [])
      .filter((w) => w && w.word && w.english)
      .slice(0, 8)
      .map((w) => ({
        id: w.key || w.reading || w.word!,
        word: w.word!,
        reading: w.reading || '',
        romaji: w.romaji || '',
        english: w.english!,
        english_alts: null as string[] | null,
        part_of_speech: w.partOfSpeech || 'word',
        jlpt_level: null as string | null,
        example_jp: null as string | null,
        example_reading: null as string | null,
        example_en: null as string | null,
      }))

    const wordIds: string[] = wordRows.map((r) => r.id)

    if (wordRows.length === 0) {
      return Response.json({
        learnBlocks: [],
        noContent: true,
        reason: 'No lesson words received from the conversation.',
      })
    }

    // Find the conversation context for each word — the first message
    // containing it (after stripping furigana annotations).
    const stripFuri = (s: string) =>
      (s || '').replace(/([一-龥々]+)\(([ぁ-んァ-ヶー]+)\)/g, '$1')

    const wordContexts: Record<string, { jp: string; en: string }> = {}
    for (const w of wordRows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const m of messages as any[]) {
        const text = stripFuri(m.contentJP || m.content || '')
        if (text.includes(w.word) || (w.reading && text.includes(w.reading))) {
          wordContexts[w.id] = {
            jp: m.contentJP || m.content || '',
            en: m.contentEN || '',
          }
          break
        }
      }
    }

    // Build a transcript summary for context — most recent ~8 exchanges
    const transcript = (messages as { role: string; content?: string; contentJP?: string; contentEN?: string }[])
      .slice(-16)
      .map((m) => {
        if (m.role === 'assistant' || m.role === 'character') {
          return `${characterName}: ${m.contentJP || m.content}`
        }
        return `Learner: ${m.contentJP || m.content || ''}${m.contentEN ? ` (${m.contentEN})` : ''}`
      })
      .join('\n')

    const kanjiConstraint = buildKanjiConstraint(kanjiLevel)

    const wordListText = wordRows
      .map((w) => {
        const alts = w.english_alts && w.english_alts.length > 0
          ? ` (also: ${w.english_alts.slice(0, 2).join(', ')})`
          : ''
        const ctx = wordContexts[w.id]
          ? `\n  In conversation: "${wordContexts[w.id].jp}"`
          : (w.example_jp ? `\n  Example: "${w.example_jp}"` : '')
        return `- ${w.word} (${w.reading} / ${w.romaji}) — ${w.english}${alts}\n  Part of speech: ${w.part_of_speech || 'unknown'}${ctx}`
      })
      .join('\n\n')

    const prompt = `You are generating a Japanese language lesson for a learner who just
finished a conversation. Build the lesson from the EXACT words below.

CONVERSATION (for context only — quote real lines in block 4):
${transcript}

LESSON WORDS (teach ALL of these, no others):
${wordListText}

${kanjiConstraint}

---

FIXED LESSON TEMPLATE — follow this exactly.
Generate 4 blocks in this exact order. Do not add extra blocks.
Do not skip blocks. Every word must appear in at least 2 of the 4 blocks.

BLOCK 1 — ENCOUNTER (type: "encounter")
  Show each lesson word in the exact sentence from the conversation where
  it appeared. If a word has no conversation context use its example
  sentence. Passive recognition with real context — no testing.

BLOCK 2 — RECOGNITION QUIZ (type: "recognition_quiz")
  For each word: audio plays the word, user chooses the correct English
  meaning from 4 options. All 4 options MUST be English meanings from
  THIS lesson's words. If fewer than 4 words, invent 1-2 plausible
  distractors from the same domain.

BLOCK 3 — BUILD THE SENTENCE (type: "sentence_build")
  User assembles a Japanese sentence from tiles. The sentence MUST use
  2-3 lesson words together naturally. Include 2 distractor tiles that
  are NOT in the correct sentence (other lesson words or natural
  particles). The sentence should feel useful — something they could say
  tomorrow.

BLOCK 4 — CONVERSATION REPLAY (type: "conversation_replay")
  Take ONE real exchange from the conversation above. Pick a meaningful
  moment. Show the character's line and the learner's response. Blank
  out ONE key lesson word (replace with ___). Provide 3 options: the
  correct word plus 2 other lesson words.

---

Return ONLY valid JSON, no markdown fences. Schema:

{
  "lessonTitle": "short evocative title",
  "lessonSubtitle": "one line — what they can say after",
  "wordCount": ${wordRows.length},
  "estimatedMinutes": 5,
  "learnBlocks": [
    {
      "id": "block-1",
      "type": "encounter",
      "order": 0,
      "xpReward": 10,
      "title": "Words from your conversation",
      "words": [
        {
          "word": "the word with furigana 漢字(かんじ) if permitted, else hiragana",
          "reading": "hiragana reading",
          "romaji": "romaji with macrons",
          "english": "primary English meaning",
          "partOfSpeech": "noun|verb|adjective|adverb|expression|particle",
          "contextSentenceJP": "exact sentence from the conversation (or example) with furigana on permitted kanji",
          "contextSentenceEN": "English translation of that sentence"
        }
      ]
    },
    {
      "id": "block-2",
      "type": "recognition_quiz",
      "order": 1,
      "xpReward": 15,
      "title": "Do you know them?",
      "questions": [
        {
          "id": "q1",
          "wordJP": "the word in the same script as block 1",
          "wordReading": "hiragana",
          "correctAnswer": "the English meaning",
          "options": ["correctAnswer", "another lesson word's English", "another", "another"]
        }
      ]
    },
    {
      "id": "block-3",
      "type": "sentence_build",
      "order": 2,
      "xpReward": 20,
      "title": "Put it together",
      "targetSentenceJP": "the assembled sentence with furigana on permitted kanji",
      "targetSentenceEN": "English translation",
      "tiles": ["each", "tile", "in", "order", "plus", "2 distractors"],
      "correctTiles": ["each", "tile", "in", "order"],
      "explanation": "one line — when you'd use this"
    },
    {
      "id": "block-4",
      "type": "conversation_replay",
      "order": 3,
      "xpReward": 20,
      "title": "Remember this moment?",
      "characterName": "${characterName}",
      "characterLine": "what the character said in the conversation (real quote)",
      "characterLineEN": "English translation",
      "userResponseJP": "the user's response with ONE lesson word replaced by ___",
      "userResponseEN": "English translation of the full response",
      "blankWord": "the word that was blanked",
      "blankWordEN": "its English meaning",
      "options": ["correct", "wrong lesson word", "wrong lesson word"]
    }
  ]
}`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lesson: any
    try {
      lesson = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse lesson JSON:', cleaned.substring(0, 500))
      return Response.json(
        { error: 'Failed to parse lesson from Claude', raw: cleaned.substring(0, 1000) },
        { status: 502 }
      )
    }

    // Defense in depth: enforce kanji whitelist on every rendered Japanese field
    lesson = cleanLesson(lesson, kanjiLevel)

    const learnBlocks = lesson.learnBlocks
    if (!Array.isArray(learnBlocks) || learnBlocks.length === 0) {
      return Response.json(
        { error: 'Lesson missing learnBlocks', raw: cleaned.substring(0, 1000) },
        { status: 502 }
      )
    }

    // Build a minimal diagnosis object so downstream code that expects it
    // (LearnPhase target-phrase victory, for example) still works.
    const targetPhraseBlock = learnBlocks.find((b: { type: string }) => b.type === 'sentence_build')
    const diagnosis = {
      failureType: 'opportunity',
      failureSummary: lesson.lessonSubtitle || '',
      targetPhrase: targetPhraseBlock?.targetSentenceJP || '',
      targetPhraseEN: targetPhraseBlock?.targetSentenceEN || '',
      teachingFocus: lesson.lessonTitle || 'Vocabulary from your conversation',
      encouragement: lesson.lessonSubtitle || '',
      retryBriefing: '',
    }

    // Persist to DB
    try {
      await sql`
        UPDATE loop_sessions
        SET diagnosis = ${JSON.stringify(diagnosis)}::jsonb,
            learn_blocks = ${JSON.stringify(learnBlocks)}::jsonb,
            lesson_word_ids = ${wordIds}::text[],
            phase = 'learn',
            last_active_at = NOW()
        WHERE id = ${sessionId}
      `
    } catch (dbError) {
      console.error('Failed to save lesson to DB:', dbError)
    }

    return Response.json({
      diagnosis,
      learnBlocks,
      lessonTitle: lesson.lessonTitle || '',
      lessonSubtitle: lesson.lessonSubtitle || '',
      wordCount: wordRows.length,
      estimatedMinutes: lesson.estimatedMinutes || 5,
      lessonWordIds: wordIds,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Loop diagnose error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
