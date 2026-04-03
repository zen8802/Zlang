import Anthropic from '@anthropic-ai/sdk'

interface UserProfile {
  nativeLanguage: 'english' | 'japanese'
  targetLanguage: 'english' | 'japanese'
  level: 'beginner' | 'intermediate' | 'advanced'
}

function buildSystemPrompt(profile: UserProfile): string {
  return `You are Zlang's language learning AI. You are a culturally fluent expert in both Japanese and English with deep knowledge of pop culture, anime, NBA, internet culture, and the specific challenges each nationality faces learning the other's language.

User profile:
- Native language: ${profile.nativeLanguage}
- Learning: ${profile.targetLanguage}
- Level: ${profile.level}

Core teaching philosophy:
1. Culture and language are inseparable. Always ground explanations in cultural context.
2. Teach living language — how people actually speak, not textbook constructs.
3. Emotional anchors create memory. Connect every explanation to the clip's emotional moment.
4. Never shame the learner. Lead with specific praise before any correction.
5. For Japanese learners: politeness register (keigo vs casual) is the #1 priority above all grammar.
6. For English learners: naturalness and social fit matter more than grammatical perfection.
7. Be vivid, specific, and occasionally funny. You are a brilliant friend, not a textbook.

Always respond in ${profile.nativeLanguage} unless the exercise explicitly requires ${profile.targetLanguage}.
Keep all explanations tied to the exact clip content provided.`
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const {
      userResponse,
      clipContext,
      targetLanguage,
      exercisePrompt,
      userLevel,
      userProfile,
    } = await request.json()

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = buildSystemPrompt(userProfile)

    const userMessage = `Grade this language learner's response. Be an encouraging but honest coach.

Exercise context: ${clipContext}
The prompt they were given: ${exercisePrompt}
Their response: ${userResponse}
Target language: ${targetLanguage}
Level: ${userLevel}

Return ONLY valid JSON in this exact structure:
{
  "scores": {
    "naturalness": { "score": 0-100, "label": "string e.g. Robotic | Textbook | Almost There | Natural | Native-level" },
    "culturalFit": { "score": 0-100, "label": "string" },
    "registerMatch": { "score": 0-100, "label": "string" },
    "grammar": { "score": 0-100, "label": "string" },
    "overall": 0-100
  },
  "grade": "S|A|B|C|D",
  "specificPraise": "string",
  "oneThingToFix": "string",
  "improvedVersion": "string",
  "nativeSpeakerReaction": "string",
  "humorRating": "string | null"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    let parsed
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim()
      parsed = JSON.parse(jsonStr)
    } catch {
      return Response.json({ error: 'Failed to parse AI response', raw: text }, { status: 502 })
    }

    return Response.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
