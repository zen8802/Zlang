import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-sonnet-4-20250514'

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

interface UserProfile {
  corridor: 'en-to-jp' | 'jp-to-en'
  level: string
  nativeLanguage: string
  targetLanguage: string
}

function getSystemPrompt(profile: UserProfile): string {
  const {
    corridor,
    level,
    nativeLanguage,
    targetLanguage,
  } = profile

  return `You are Zlang, an expert language tutor helping a student learn ${targetLanguage} (native language: ${nativeLanguage}, corridor: ${corridor}).

Student profile:
- Level: ${level}

Core principles:
1. ALWAYS adapt your explanations to the student's level (${level}).
2. Emphasize REAL, natural language — not textbook stiffness. Teach how people actually speak.
3. Explain cultural context. Language is inseparable from culture.
4. Be encouraging but honest. Praise what's good, clearly note what needs work.
5. When the corridor is en-to-jp, explain Japanese in English but include romaji AND kana/kanji.
6. When the corridor is jp-to-en, explain English in Japanese but include natural English examples.
7. Keep explanations concise. Students learn by doing, not reading walls of text.
8. Use humor and personality — you're a cool tutor, not a boring professor.

Response format: Use markdown for structure. Use code blocks for vocabulary tables when appropriate.`
}

// ---------------------------------------------------------------------------
// Helper to build a profile from partial params
// ---------------------------------------------------------------------------

function buildProfile(corridor: string, level: string): UserProfile {
  const isEnToJp = corridor === 'en-to-jp'
  return {
    corridor: corridor as 'en-to-jp' | 'jp-to-en',
    level,
    nativeLanguage: isEnToJp ? 'English' : 'Japanese',
    targetLanguage: isEnToJp ? 'Japanese' : 'English',
  }
}

// ---------------------------------------------------------------------------
// Decode Generator — analyzes a clip for language learning
// ---------------------------------------------------------------------------

export async function generateDecode(
  clipTitle: string,
  transcript: string,
  translation: string,
  userLevel: string,
  corridor: string = 'en-to-jp',
) {
  const profile = buildProfile(corridor, userLevel)

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    system: getSystemPrompt(profile),
    messages: [
      {
        role: 'user',
        content: `Analyze the following clip for language learning. Break down each line with literal and natural translations, grammar explanations, and cultural context.

Clip: "${clipTitle}"

Transcript (${profile.targetLanguage}):
${transcript}

Translation (${profile.nativeLanguage}):
${translation}

Respond in this JSON structure (return ONLY valid JSON, no markdown fences):
{
  "mainGrammarPoint": "the key grammar concept in this clip",
  "culturalNote": "relevant cultural context",
  "vocab": [
    { "word": "...", "reading": "...", "meaning": "...", "exampleSentence": "...", "exampleTranslation": "..." }
  ],
  "whyThisMatters": "motivational connection to why this matters for the student",
  "difficulty": "beginner|intermediate|advanced",
  "elements": [
    {
      "line": "original line",
      "timestamp": 0,
      "literalTranslation": "...",
      "naturalTranslation": "...",
      "grammarExplanation": "...",
      "culturalContext": "...",
      "level": "beginner|intermediate|advanced"
    }
  ]
}`,
      },
    ],
  })

  return stream
}

// ---------------------------------------------------------------------------
// Response Grader — grades user's written response
// ---------------------------------------------------------------------------

export async function gradeResponse(
  response: string,
  targetLanguage: string,
  context: string,
  userLevel: string,
  corridor: string,
) {
  const profile = buildProfile(corridor, userLevel)

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    system: getSystemPrompt(profile),
    messages: [
      {
        role: 'user',
        content: `Grade this student's written response in ${targetLanguage}.

Context (what the student was responding to):
${context}

Student's response:
"${response}"

Student level: ${userLevel}

Grade across these four dimensions (each 1-10) and provide feedback. Respond in this JSON structure (return ONLY valid JSON, no markdown fences):
{
  "casualnessScore": 7,
  "culturalFitScore": 6,
  "naturalSlangScore": 5,
  "grammarScore": 8,
  "overallFeedback": "Honest, encouraging overall assessment",
  "improvedVersion": "A more natural version of what they wrote",
  "specificPraise": "What they did well",
  "oneThingToFix": "One specific actionable improvement"
}`,
      },
    ],
  })

  return stream
}

// ---------------------------------------------------------------------------
// Cultural Deep Dive — generates cultural analysis
// ---------------------------------------------------------------------------

export async function generateCulturalDive(
  clipContext: string,
  culturalNotes: string,
  corridor: string,
) {
  const profile = buildProfile(corridor, 'intermediate')

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 3072,
    system: getSystemPrompt(profile),
    messages: [
      {
        role: 'user',
        content: `Generate a cultural deep dive based on this clip context.

Clip context:
${clipContext}

Initial cultural notes:
${culturalNotes}

Write an engaging, educational cultural exploration that covers:
1. The cultural significance of what was said/shown
2. How this connects to broader cultural norms
3. Common mistakes foreigners make in this context
4. A "did you know?" fact that's surprising and memorable
5. How understanding this culture makes your language sound more natural

Keep it conversational and interesting — like a knowledgeable friend explaining culture, not a Wikipedia article.`,
      },
    ],
  })

  return stream
}

// ---------------------------------------------------------------------------
// Conversation Simulator — for Dojo mode
// ---------------------------------------------------------------------------

export async function simulateConversation(
  scenario: string,
  messages: Array<{ role: string; content: string }>,
  corridor: string,
  level: string,
) {
  const profile = buildProfile(corridor, level)
  const isEnToJp = corridor === 'en-to-jp'
  const targetLang = isEnToJp ? 'Japanese' : 'English'

  const systemPrompt = `${getSystemPrompt(profile)}

You are now in CONVERSATION DOJO mode. You are role-playing a scenario: "${scenario}"

Rules:
1. Stay in character for the scenario.
2. Speak primarily in ${targetLang}, matching the student's level (${level}).
3. For beginners, use simple ${targetLang} with ${isEnToJp ? 'English' : 'Japanese'} hints in parentheses.
4. For advanced students, use fully natural ${targetLang}.
5. After each response, add a brief "(Tutor note: ...)" with any corrections or tips about what the student said — but keep it short.
6. If the student makes a mistake, gently model the correct form in your next reply.
7. Keep responses conversational — 1-3 sentences in character, then the tutor note.
8. Be warm and encouraging. Make the student feel like they're really having this conversation.`

  const formattedMessages = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: formattedMessages,
  })

  return stream
}

// ---------------------------------------------------------------------------
// Humor Analyzer
// ---------------------------------------------------------------------------

export async function analyzeHumor(
  clipContext: string,
  transcript: string,
  corridor: string,
) {
  const profile = buildProfile(corridor, 'intermediate')

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    system: getSystemPrompt(profile),
    messages: [
      {
        role: 'user',
        content: `Analyze the humor in this clip. Help the student understand why it's funny.

Clip context:
${clipContext}

Transcript:
${transcript}

Cover these aspects:
1. **What's the joke?** — Plain explanation of what makes it funny
2. **Language tricks** — Any puns, wordplay, double meanings, or linguistic humor
3. **Cultural layer** — Cultural references or norms that make it funny to native speakers
4. **Humor type** — What category: pun, sarcasm, manzai, slapstick, deadpan, cultural, etc.
5. **Key vocabulary** — Words/phrases essential to understanding the humor
6. **Try it yourself** — A similar joke structure the student could try using

Make the explanation fun — humor about humor should itself be entertaining!`,
      },
    ],
  })

  return stream
}

// ---------------------------------------------------------------------------
// Comprehension Questions generator
// ---------------------------------------------------------------------------

export async function generateComprehensionQuestions(
  clipTitle: string,
  transcript: string,
  corridor: string,
) {
  const profile = buildProfile(corridor, 'intermediate')

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    system: getSystemPrompt(profile),
    messages: [
      {
        role: 'user',
        content: `Generate comprehension questions for this clip.

Clip: "${clipTitle}"
Transcript:
${transcript}

Generate 4-5 multiple-choice questions that test understanding of:
- Literal meaning (what was said)
- Implied meaning (what was meant)
- Vocabulary (key words)
- Grammar (structures used)
- Cultural context

Respond in this JSON structure (return ONLY valid JSON, no markdown fences):
{
  "questions": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}`,
      },
    ],
  })

  return stream
}

// ---------------------------------------------------------------------------
// Shadowing grader
// ---------------------------------------------------------------------------

export async function gradeShadowing(
  original: string,
  userAttempt: string,
  targetLanguage: string,
) {
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system:
      'You are a pronunciation and speaking coach. Be encouraging but precise in your feedback.',
    messages: [
      {
        role: 'user',
        content: `Compare the student's shadowing attempt to the original.

Original (${targetLanguage}):
"${original}"

Student's attempt (transcribed):
"${userAttempt}"

Evaluate and respond in this JSON structure (return ONLY valid JSON, no markdown fences):
{
  "stars": 3,
  "accuracy": 85,
  "feedback": "Overall assessment of their shadowing",
  "missedWords": ["word1", "word2"],
  "pronunciationTips": ["tip1", "tip2"],
  "encouragement": "Something motivating"
}

Stars scale: 1 = needs work, 2 = decent, 3 = good, 4 = great, 5 = native-like`,
      },
    ],
  })

  return stream
}
