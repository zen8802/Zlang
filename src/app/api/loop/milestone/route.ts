import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { sessionId, messages, retryCount, partial } = await request.json()

    if (!sessionId) {
      return Response.json({ error: 'sessionId is required' }, { status: 400 })
    }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages array is required' }, { status: 400 })
    }

    // Build transcript from user messages only for highlight picking
    const userLines = messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((m: any) => m.role === 'user')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((m: any) => m.content)

    // Build full transcript for context
    const fullTranscript = messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((m: any) => {
        const role = m.role === 'user' ? 'LEARNER' : 'CHARACTER'
        const content = (m.content || '').split('---VOCAB---')[0].trim()
        return `${role}: ${content}`
      })
      .join('\n\n')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const milestonePrompt = `You are generating a milestone achievement card for a Japanese language learner who just completed a Loop (Attempt → Learn → Retry cycle).

FULL CONVERSATION:
${fullTranscript}

LEARNER'S LINES:
${userLines.join('\n')}

RETRY COUNT: ${retryCount || 0}
RESULT: ${partial ? 'Partial success — they showed improvement but didn\'t fully demonstrate mastery' : 'Success — they demonstrated the target skill'}

Generate a milestone card. Pick the BEST Japanese line the learner said — the one that shows the most growth, natural usage, or effort.

Return ONLY valid JSON (no markdown fences):
{
  "bestLine": "The learner's best Japanese line (copy exactly from their messages)",
  "bestLineRomaji": "Romaji reading of that line",
  "bestLineEnglish": "Natural English translation",
  "culturalInsight": "One interesting cultural insight related to what they practiced (1 sentence, specific and concrete)",
  "achievement": "A short achievement label like 'First Order' or 'Polite Pro' (2-3 words max)",
  "achievementEmoji": "One emoji for the achievement",
  "xpEarned": ${partial ? '25' : '50'},
  "encouragement": "A warm, specific 1-sentence encouragement message that references what they did well"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: milestonePrompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let milestone: any
    try {
      milestone = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse milestone JSON:', cleaned.substring(0, 500))
      // Generate a fallback milestone
      milestone = {
        bestLine: userLines[userLines.length - 1] || 'がんばりました！',
        bestLineRomaji: '',
        bestLineEnglish: '',
        culturalInsight: 'Every conversation is a step forward in your Japanese journey.',
        achievement: 'Loop Complete',
        achievementEmoji: '🔄',
        xpEarned: partial ? 25 : 50,
        encouragement: 'You showed real growth in this conversation. Keep it up!',
      }
    }

    // Add metadata
    milestone.sessionId = sessionId
    milestone.retryCount = retryCount || 0
    milestone.partial = !!partial
    milestone.completedAt = new Date().toISOString()

    // Save to DB
    if (process.env.DATABASE_URL) {
      try {
        const { neon } = await import('@neondatabase/serverless')
        const sql = neon(process.env.DATABASE_URL!)

        // Update the loop session with milestone data and mark as complete
        await sql`
          UPDATE loop_sessions
          SET milestone_card = ${JSON.stringify(milestone)}::jsonb,
              phase = 'complete'
          WHERE id = ${sessionId}
        `

        // Also save to user_milestones table for long-term tracking
        try {
          await sql`
            INSERT INTO user_milestones (
              session_id, best_line, best_line_romaji, best_line_english,
              cultural_insight, achievement, achievement_emoji,
              xp_earned, encouragement, retry_count, partial,
              completed_at
            )
            VALUES (
              ${sessionId},
              ${milestone.bestLine},
              ${milestone.bestLineRomaji || ''},
              ${milestone.bestLineEnglish || ''},
              ${milestone.culturalInsight || ''},
              ${milestone.achievement || 'Loop Complete'},
              ${milestone.achievementEmoji || '🔄'},
              ${milestone.xpEarned || 0},
              ${milestone.encouragement || ''},
              ${retryCount || 0},
              ${!!partial},
              NOW()
            )
          `
        } catch (milestonesError) {
          // user_milestones table might not exist yet — log but don't fail
          console.error('Failed to save to user_milestones table:', milestonesError)
        }
      } catch (dbError) {
        console.error('Failed to save milestone to DB:', dbError)
      }
    }

    return Response.json(milestone)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Loop milestone error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
