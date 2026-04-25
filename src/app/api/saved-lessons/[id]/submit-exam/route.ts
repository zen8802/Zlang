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
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB' }, { status: 500 })

  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const { answers, timeTaken } = await req.json()

  const rows = (await sql`
    SELECT exam_questions, exam_results, best_exam_score, times_retaken
    FROM saved_lessons
    WHERE id = ${params.id} AND user_id = ${userId}
  `) as Row[]
  const lesson = rows[0]
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const questions = lesson.exam_questions || []
  let earnedPoints = 0
  let totalPoints = 0

  const breakdown = questions.map((q: Row) => {
    totalPoints += q.points || 10
    const userAnswer = answers?.[q.id]
    let correct = false

    if (q.type === 'free_write') {
      correct = userAnswer === 'correct'
    } else if (q.options) {
      const correctOpt = q.options.find((o: Row) => o.isCorrect)
      correct = userAnswer === correctOpt?.id
    } else if (q.correctAnswer) {
      correct = (userAnswer || '').trim() === (q.correctAnswer || '').trim()
    } else if (q.targetSentence) {
      correct = (userAnswer || '').trim() === (q.targetSentence || '').trim()
    }

    if (correct) earnedPoints += q.points || 10

    return {
      questionId: q.id,
      type: q.type,
      prompt: q.prompt,
      userAnswer,
      correct,
      explanation: q.explanation,
    }
  })

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
  const passed = score >= 70

  const result = {
    attemptNumber: (lesson.exam_results?.length || 0) + 1,
    date: new Date().toISOString(),
    score,
    earnedPoints,
    totalPoints,
    passed,
    timeTaken,
    breakdown,
  }

  const newResults = [...(lesson.exam_results || []), result]
  const bestScore = Math.max(score, lesson.best_exam_score || 0)

  await sql`
    UPDATE saved_lessons SET
      exam_results = ${JSON.stringify(newResults)}::jsonb,
      best_exam_score = ${bestScore},
      last_exam_score = ${score},
      times_retaken = ${(lesson.times_retaken || 0) + 1},
      last_studied_at = NOW()
    WHERE id = ${params.id}
  `

  return NextResponse.json({ score, passed, earnedPoints, totalPoints, breakdown, bestScore })
}
