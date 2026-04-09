import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { sessionId, messages, isRetry } = await request.json()

    if (!sessionId) {
      return Response.json({ error: 'sessionId is required' }, { status: 400 })
    }
    if (!messages || !Array.isArray(messages) || messages.length < 2) {
      return Response.json({ error: 'At least 2 messages are required for diagnosis' }, { status: 400 })
    }

    // Build transcript from conversation
    const transcript = messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((m: any) => {
        const role = m.role === 'user' ? 'LEARNER' : 'CHARACTER'
        // Strip vocab/romaji/en/coach/options sections for cleaner analysis
        const content = (m.content || '').split('---VOCAB---')[0].trim()
        return `${role}: ${content}`
      })
      .join('\n\n')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const diagnosisPrompt = `You are a Japanese language learning diagnostic engine. Analyze this conversation between a learner and a character, then generate a targeted micro-lesson.

CONVERSATION TRANSCRIPT:
${transcript}

${isRetry ? 'NOTE: This is a RETRY attempt. The learner already went through the learn phase once. Focus on any REMAINING or NEW failures.' : ''}

STEP 1: Identify the PRIMARY failure. Pick ONE category:
- vocabulary: didn't know a key word needed for the conversation
- grammar: used wrong grammar structure (particles, verb forms, conjugation)
- phrase: didn't know a common phrase/expression for this situation
- culture: made a cultural mistake (wrong politeness level, inappropriate response)
- confidence: was too hesitant or switched to English when they could have tried Japanese

STEP 2: Generate 3-4 lesson blocks that directly teach what the learner needs.

Return ONLY valid JSON (no markdown fences, no commentary). Use this exact schema:

{
  "diagnosis": {
    "failureType": "vocabulary|grammar|phrase|culture|confidence",
    "failureSummary": "1-2 sentence description of what went wrong",
    "targetWord": "the specific word/phrase they need (in Japanese with furigana)",
    "targetPhrase": "a full phrase using the target (in Japanese with furigana)",
    "targetReading": "romaji of the target",
    "targetEnglish": "English meaning",
    "encouragement": "A warm, specific encouragement message (in English). Reference what they DID do well.",
    "retryBriefing": "1-2 sentences explaining what to focus on in the retry conversation"
  },
  "learnBlocks": [
    ... (3-4 blocks, see schemas below)
  ]
}

BLOCK SCHEMAS — use EXACTLY these types and fields:

TYPE "flashcard":
{
  "id": "block_flash_1",
  "type": "flashcard",
  "order": 1,
  "xpReward": 15,
  "cards": [
    {
      "word": "漢字(かんじ) with furigana",
      "reading": "hiragana reading",
      "romaji": "romaji",
      "english": "English meaning",
      "partOfSpeech": "noun|verb|adjective|adverb|particle|phrase|greeting|counter|expression",
      "jlptLevel": "N5|N4|N3|N2|N1",
      "exampleJP": "Example sentence in Japanese with furigana",
      "exampleEN": "English translation of example",
      "memoryHook": "A memorable mnemonic or association to help remember this word"
    }
  ]
}

TYPE "image_match":
{
  "id": "block_img_1",
  "type": "image_match",
  "order": 2,
  "xpReward": 10,
  "title": "Match the word",
  "instruction": "Tap the image that matches the word",
  "mode": "image_to_word",
  "items": [
    {
      "id": "item_1",
      "image": "emoji representing the item (e.g. 🍜)",
      "word": "word with furigana",
      "reading": "hiragana",
      "romaji": "romaji",
      "english": "English"
    }
  ]
}

TYPE "audio_match":
{
  "id": "block_audio_1",
  "type": "audio_match",
  "order": 3,
  "xpReward": 10,
  "title": "Listen and match",
  "instruction": "Choose the correct meaning",
  "items": [
    {
      "id": "item_1",
      "word": "word with furigana",
      "reading": "hiragana",
      "romaji": "romaji",
      "english": "English",
      "image": "emoji (optional)",
      "options": [
        { "id": "opt_1", "text": "correct answer", "isCorrect": true },
        { "id": "opt_2", "text": "wrong answer 1", "isCorrect": false },
        { "id": "opt_3", "text": "wrong answer 2", "isCorrect": false }
      ]
    }
  ]
}

TYPE "dialogue_choice":
{
  "id": "block_dial_1",
  "type": "dialogue_choice",
  "order": 2,
  "xpReward": 15,
  "title": "Choose the right response",
  "exchanges": [
    {
      "id": "ex_1",
      "character": {
        "name": "character name",
        "nameJP": "name in Japanese",
        "emoji": "character emoji",
        "color": "#hex color"
      },
      "setting": "brief context",
      "line": "Character's line in Japanese with furigana",
      "lineReading": "hiragana reading",
      "lineRomaji": "romaji",
      "lineEN": "English translation",
      "vocab": [
        { "word": "key word", "reading": "hiragana", "romaji": "romaji", "meaning": "English", "pos": "noun" }
      ],
      "question": "How should you respond?",
      "options": [
        { "id": "opt_1", "text": "correct response", "isCorrect": true },
        { "id": "opt_2", "text": "wrong response", "isCorrect": false },
        { "id": "opt_3", "text": "wrong response", "isCorrect": false }
      ],
      "explanation": "Why the correct answer works",
      "culturalHint": "Cultural context if relevant"
    }
  ]
}

TYPE "trace":
{
  "id": "block_trace_1",
  "type": "trace",
  "order": 3,
  "xpReward": 10,
  "title": "Practice writing",
  "characters": [
    {
      "character": "the kanji or kana character",
      "reading": "hiragana reading",
      "romaji": "romaji",
      "english": "English meaning",
      "strokeCount": 8,
      "memoryHook": "mnemonic for remembering this character"
    }
  ]
}

TYPE "culture_note":
{
  "id": "block_culture_1",
  "type": "culture_note",
  "order": 4,
  "xpReward": 5,
  "emoji": "relevant emoji",
  "headline": "Cultural insight title",
  "body": "2-3 sentence explanation of the cultural point",
  "neverInTextbook": "A surprising fact you won't find in textbooks",
  "relatedWords": [
    { "word": "Japanese word with furigana", "reading": "hiragana", "meaning": "English" }
  ]
}

TYPE "sentence":
{
  "id": "block_sent_1",
  "type": "sentence",
  "order": 2,
  "xpReward": 10,
  "sentences": [
    {
      "id": "s_1",
      "japanese": "Full sentence with furigana",
      "romaji": "romaji",
      "english": "English translation",
      "keywords": [
        { "word": "key word", "reading": "hiragana", "meaning": "English", "jlptLevel": "N5", "example": "example usage" }
      ],
      "grammarNote": "Brief grammar explanation",
      "emotionTag": "casual|polite|formal|excited|apologetic"
    }
  ]
}

TYPE "fill_blank":
{
  "id": "block_fill_1",
  "type": "fill_blank",
  "order": 3,
  "xpReward": 10,
  "title": "Fill in the blank",
  "instruction": "Type the missing word",
  "sentences": [
    {
      "id": "fb_1",
      "before": "text before the blank (with furigana)",
      "answer": "the correct word",
      "after": "text after the blank (with furigana)",
      "hint": "hint for the answer",
      "explanation": "why this is correct"
    }
  ]
}

TYPE "matching":
{
  "id": "block_match_1",
  "type": "matching",
  "order": 3,
  "xpReward": 10,
  "pairs": [
    { "id": "p_1", "left": "Japanese (with furigana)", "right": "English meaning" },
    { "id": "p_2", "left": "Japanese (with furigana)", "right": "English meaning" },
    { "id": "p_3", "left": "Japanese (with furigana)", "right": "English meaning" },
    { "id": "p_4", "left": "Japanese (with furigana)", "right": "English meaning" }
  ]
}

TYPE "shadowing":
{
  "id": "block_shadow_1",
  "type": "shadowing",
  "order": 4,
  "xpReward": 15,
  "targetSentence": "Full Japanese sentence with furigana",
  "targetRomaji": "romaji",
  "targetEnglish": "English translation",
  "breakdown": [
    { "japanese": "chunk with furigana", "romaji": "romaji", "english": "English" }
  ]
}

IMPORTANT RULES:
- Generate exactly 3-4 blocks
- The first block should ALWAYS be a flashcard block with 2-4 cards covering the target vocabulary
- The remaining blocks should reinforce the same material with different exercise types
- Vary the block types — don't repeat the same type
- All Japanese text must use furigana format: 漢字(かんじ)
- Block IDs must be unique strings
- Order should be sequential (1, 2, 3, 4)
- XP rewards: flashcard=15, dialogue_choice=15, shadowing=15, others=10, culture_note=5
- Make the content DIRECTLY relevant to what the learner failed at in the conversation`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: diagnosisPrompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any
    try {
      result = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse diagnosis JSON from Claude:', cleaned.substring(0, 500))
      return Response.json(
        { error: 'Failed to parse diagnosis from Claude', raw: cleaned.substring(0, 1000) },
        { status: 502 }
      )
    }

    const { diagnosis, learnBlocks } = result

    if (!diagnosis || !learnBlocks) {
      return Response.json(
        { error: 'Claude response missing diagnosis or learnBlocks', raw: cleaned.substring(0, 1000) },
        { status: 502 }
      )
    }

    // Save diagnosis + learn blocks to DB
    if (process.env.DATABASE_URL) {
      try {
        const { neon } = await import('@neondatabase/serverless')
        const sql = neon(process.env.DATABASE_URL!)
        await sql`
          UPDATE loop_sessions
          SET diagnosis = ${JSON.stringify(diagnosis)}::jsonb,
              learn_blocks = ${JSON.stringify(learnBlocks)}::jsonb,
              phase = 'learn'
          WHERE id = ${sessionId}
        `
      } catch (dbError) {
        console.error('Failed to save diagnosis to DB:', dbError)
      }
    }

    return Response.json({ diagnosis, learnBlocks })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Loop diagnose error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
