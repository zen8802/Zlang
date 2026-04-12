import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import {
  detectPromptInjection,
  extractWordsFromMessages,
  updateUserCards,
  validateMessages,
} from '@/lib/word-extractor'

interface CountRow {
  count: string
}
interface FlagRow {
  flagged_for_review: boolean
}

// Silent-block response shape — never tells the user WHY their session was
// flagged. The honest abuser sees zero progress and gives up; an accidental
// false positive just has a slightly disappointing session, not an error.
const blockedResponse = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extras: Record<string, any> = {},
) =>
  NextResponse.json({
    newUnlocks: [],
    strengthened: [],
    mastered: [],
    blocked: true,
    ...extras,
  })

async function logAbuse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sql: any,
  userId: string,
  sessionId: string | undefined,
  abuseType: string,
  details: string | undefined,
  cardsBlocked = 0,
) {
  try {
    await sql`
      INSERT INTO abuse_log (
        user_id, session_id, abuse_type, details, cards_blocked
      ) VALUES (
        ${userId}, ${sessionId || null}, ${abuseType}, ${details || null}, ${cardsBlocked}
      )
    `

    // Auto-flag accounts with 5+ abuse incidents in the last 7 days.
    // We never auto-ban — flag is for human review only.
    const recentAbuse = (await sql`
      SELECT COUNT(*) AS count FROM abuse_log
      WHERE user_id = ${userId}
        AND created_at > NOW() - INTERVAL '7 days'
    `) as CountRow[]
    const abuseCount = parseInt(recentAbuse[0]?.count || '0', 10)

    if (abuseCount >= 5) {
      await sql`
        INSERT INTO user_flags (user_id, flagged_for_review, flagged_at, reason)
        VALUES (${userId}, true, NOW(), ${`${abuseCount} abuse events in last 7 days`})
        ON CONFLICT (user_id) DO UPDATE SET
          flagged_for_review = true,
          flagged_at = NOW(),
          reason = EXCLUDED.reason
      `
    }
  } catch (err) {
    console.error('logAbuse failed:', err)
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { messages, scenarioId, sessionId } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0 || !scenarioId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        newUnlocks: [],
        strengthened: [],
        mastered: [],
      })
    }

    const sql = neon(process.env.DATABASE_URL)

    // ── DEFENSE 3: Session rate limiting ────────────────────────────────
    // After 3 sessions of the SAME scenario in 24h, no card credit awarded.
    // The user can still practice — they just don't farm cards.
    const recentSame = (await sql`
      SELECT COUNT(*) AS count FROM loop_sessions
      WHERE user_id = ${userId}
        AND scenario_id = ${scenarioId}
        AND created_at > NOW() - INTERVAL '24 hours'
    `) as CountRow[]
    const sameScenarioCount = parseInt(recentSame[0]?.count || '0', 10)
    if (sameScenarioCount > 3) {
      return NextResponse.json({
        newUnlocks: [],
        strengthened: [],
        mastered: [],
        rateLimited: true,
        message: 'Great practice! Try a new scenario to earn more cards.',
      })
    }

    // After 8 sessions in 1h across ANY scenario, take a break message.
    const recentAll = (await sql`
      SELECT COUNT(*) AS count FROM loop_sessions
      WHERE user_id = ${userId}
        AND created_at > NOW() - INTERVAL '1 hour'
    `) as CountRow[]
    const hourlyCount = parseInt(recentAll[0]?.count || '0', 10)
    if (hourlyCount > 8) {
      return NextResponse.json({
        newUnlocks: [],
        strengthened: [],
        mastered: [],
        rateLimited: true,
        message: 'Take a break — your collection will be here when you return.',
      })
    }

    // ── DEFENSE 4: Message length validation (paste detection) ──────────
    const validation = validateMessages(messages)
    if (!validation.isValid) {
      await logAbuse(
        sql,
        userId,
        sessionId,
        'paste_detected',
        validation.reason,
      )
      return blockedResponse()
    }

    // ── DEFENSE 1: Prompt injection detection ───────────────────────────
    const injection = await detectPromptInjection(messages)
    if (injection.isTainted) {
      await logAbuse(
        sql,
        userId,
        sessionId,
        'prompt_injection',
        injection.reason,
      )
      return blockedResponse()
    }

    // ── EXTRACTION (only runs if all defenses pass) ─────────────────────
    const extracted = await extractWordsFromMessages(messages)

    // Defense 6/7 (scenario diversity, daily dedup, mastery production
    // weighting, 3-day rule) all live inside updateUserCards.
    const { newUnlocks, strengthened, mastered } = await updateUserCards(
      userId,
      extracted,
      scenarioId,
    )

    // Surface the flagged_for_review state so the client can disable card
    // awards entirely if a human review hasn't happened yet. We still ran
    // the loop above so the lesson + recognize phase work normally.
    const flagRows = (await sql`
      SELECT flagged_for_review FROM user_flags WHERE user_id = ${userId} LIMIT 1
    `) as FlagRow[]
    const flagged = flagRows[0]?.flagged_for_review === true

    if (flagged) {
      return NextResponse.json({
        newUnlocks: [],
        strengthened: [],
        mastered: [],
        blocked: true,
      })
    }

    return NextResponse.json({
      newUnlocks,
      strengthened,
      mastered,
      totalExtracted: extracted.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tracking failed'
    console.error('Card tracking error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
