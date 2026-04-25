import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Missing config' }, { status: 500 })
  }

  const { forceNew } = await req.json().catch(() => ({}))

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const rows = (await sql`
    SELECT * FROM saved_lessons WHERE id = ${params.id} AND user_id = ${userId}
  `) as Row[]
  const lesson = rows[0]
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Return cached exam unless forceNew
  if (lesson.exam_questions?.length > 0 && !forceNew) {
    return NextResponse.json({ questions: lesson.exam_questions })
  }

  const vocab = lesson.vocabulary_discovered || []
  const hiragana = lesson.hiragana_discovered || []
  const kanji = lesson.kanji_discovered || []
  const level = lesson.user_experience_level || 3
  const isBeginnerLesson = level <= 3

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `Generate an exam for a Japanese learner based on EXACTLY this lesson's content. Test ONLY what is listed. Do not add anything not in these lists.

LESSON: ${lesson.scenario_title}
LEVEL: ${level}/10 (${isBeginnerLesson ? 'beginner' : 'intermediate'})

VOCABULARY LEARNED:
${vocab.map((v: Row) => `${v.word} (${v.reading}) = ${v.english} [${v.partOfSpeech || v.part_of_speech}]`).join('\n') || 'none'}

HIRAGANA LEARNED: ${hiragana.join('、') || 'none'}
KANJI LEARNED: ${kanji.join('、') || 'none'}

Generate 6-8 exam questions. Mix these types:
${isBeginnerLesson
  ? '- word_to_meaning: see Japanese, choose English\n- fill_sentence: fill one blank\n- free_write: write a hiragana character (blank grid)\n- multiple_choice_cultural: cultural fact from the lesson'
  : '- word_to_meaning\n- meaning_to_word: see English, choose Japanese\n- fill_sentence\n- sentence_assembly: arrange words\n- context_usage: which word fits?'}

STRICT RULES:
1. EVERY question tests something from the lists above
2. Wrong answer options come from the vocabulary list too (not random words)
3. free_write only uses characters from hiragana/kanji lists above
4. Cultural questions reference this specific scenario (${lesson.scenario_title})

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "type": "word_to_meaning|fill_sentence|free_write|multiple_choice_cultural|meaning_to_word|sentence_assembly|context_usage",
      "points": 10,
      "prompt": "the question",
      "options": [
        { "id": "a", "text": "option", "isCorrect": true },
        { "id": "b", "text": "option", "isCorrect": false },
        { "id": "c", "text": "option", "isCorrect": false },
        { "id": "d", "text": "option", "isCorrect": false }
      ],
      "targetCharacter": "for free_write only",
      "targetReading": "reading",
      "targetEnglish": "meaning",
      "sentenceWithBlank": "for fill_sentence",
      "correctAnswer": "for fill_sentence",
      "wordBank": ["for fill_sentence distractors"],
      "targetSentence": "for sentence_assembly",
      "tiles": ["scrambled words for assembly"],
      "explanation": "brief explanation"
    }
  ],
  "totalPoints": 80,
  "passingScore": 70
}`,
      },
    ],
  })

  try {
    const text = res.content[0].type === 'text' ? res.content[0].text : ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

    await sql`
      UPDATE saved_lessons
      SET exam_questions = ${JSON.stringify(parsed.questions)}::jsonb
      WHERE id = ${params.id}
    `

    return NextResponse.json({
      questions: parsed.questions,
      totalPoints: parsed.totalPoints || 80,
      passingScore: parsed.passingScore || 70,
    })
  } catch (err) {
    console.error('Exam parse error:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
