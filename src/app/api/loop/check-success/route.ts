import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const { messages, targetFailure } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'messages array is required' }, { status: 400 })
    }
    if (!targetFailure) {
      return Response.json({ error: 'targetFailure is required' }, { status: 400 })
    }

    // Extract only the user's messages for analysis
    const userMessages = messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((m: any) => m.role === 'user')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((m: any) => m.content)
      .join('\n')

    if (!userMessages.trim()) {
      return Response.json({ succeeded: false, reason: 'No user messages found' })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const checkPrompt = `You are a Japanese language learning evaluator. Determine if the learner successfully demonstrated the target skill in their retry conversation.

TARGET FAILURE THAT WAS DIAGNOSED:
- Type: ${targetFailure.failureType || 'unknown'}
- Summary: ${targetFailure.failureSummary || 'unknown'}
- Target word: ${targetFailure.targetWord || 'none specified'}
- Target phrase: ${targetFailure.targetPhrase || 'none specified'}
- Target meaning: ${targetFailure.targetEnglish || 'none specified'}

LEARNER'S MESSAGES DURING RETRY:
${userMessages}

EVALUATION CRITERIA:
- For vocabulary failures: Did the learner use the target word or a close synonym correctly?
- For grammar failures: Did the learner use the correct grammar structure?
- For phrase failures: Did the learner use the target phrase or demonstrate understanding of it?
- For culture failures: Did the learner show improved cultural awareness in their responses?
- For confidence failures: Did the learner attempt to communicate in Japanese rather than switching to English?

Be GENEROUS in your evaluation. If the learner made a reasonable attempt and showed they learned something, count it as success. They don't need to be perfect.

Return ONLY valid JSON (no markdown fences):
{
  "succeeded": true or false,
  "reason": "1-2 sentence explanation of your evaluation",
  "highlight": "the specific text from their messages that demonstrates success (or null if they didn't succeed)"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: checkPrompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any
    try {
      result = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse check-success JSON:', cleaned.substring(0, 500))
      // Default to generous — if we can't parse, assume partial success
      return Response.json({
        succeeded: true,
        reason: 'Evaluation parsing failed, defaulting to success.',
        highlight: null,
      })
    }

    return Response.json({
      succeeded: !!result.succeeded,
      reason: result.reason || '',
      highlight: result.highlight || null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Loop check-success error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
