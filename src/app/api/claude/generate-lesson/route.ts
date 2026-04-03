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
      completedLessons,
      weakVocab,
      weakGrammarPoints,
      userProfile,
    } = await request.json()

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = buildSystemPrompt(userProfile)

    const userMessage = `Generate the next personalized lesson for this language learner.

Completed lessons: ${completedLessons.join(', ')}
Vocabulary they struggle with: ${weakVocab.join(', ')}
Grammar points needing work: ${weakGrammarPoints.join(', ')}
Level: ${userProfile.level}
Learning: ${userProfile.targetLanguage}

Return ONLY valid JSON:
{
  "id": "string — lesson-{timestamp}",
  "title": "string",
  "titleNative": "string — title in target language",
  "objective": "string — one clear learning outcome",
  "targetGrammar": "string",
  "targetVocab": ["5 specific words to teach"],
  "culturalTheme": "string",
  "recommendedClipSearch": "string — YouTube search query",
  "warmup": "string — 2-sentence warmup question",
  "decodePrompt": "string — what to look for in the clip",
  "responseExercise": "string — the Phase 4 exercise prompt",
  "whyThisNow": "string — why this lesson is right for this learner"
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
