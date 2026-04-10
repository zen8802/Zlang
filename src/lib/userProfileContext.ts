// ---------------------------------------------------------------------------
// Shared helper: build a learner-profile context block for AI prompts.
// Used by both the lesson translate-response API and the Loop message API.
// ---------------------------------------------------------------------------

export interface UserProfilePayload {
  direction?: 'en-to-jp' | 'jp-to-en' | null
  age?: number | null
  gender?: string | null
  experience?: number | null
}

export function buildProfileContext(profile: UserProfilePayload | null | undefined): string {
  if (!profile) return ''

  const parts: string[] = []

  // Age
  if (typeof profile.age === 'number' && profile.age > 0) {
    if (profile.age < 18) {
      parts.push(
        `The learner is ${profile.age} years old — a teenager. Use casual, youthful Japanese appropriate for their age. Avoid overly formal register.`,
      )
    } else if (profile.age >= 60) {
      parts.push(
        `The learner is ${profile.age} years old. Use respectful, measured Japanese. Avoid overly casual or youth slang.`,
      )
    } else {
      parts.push(`The learner is ${profile.age} years old — an adult.`)
    }
  }

  // Gender
  if (profile.gender === 'male') {
    parts.push(
      `The learner is male. Where gender affects Japanese register (sentence endings like ぞ/ぜ vs わ/のよ, vocabulary choices), favor masculine speech patterns naturally — not stereotypically.`,
    )
  } else if (profile.gender === 'female') {
    parts.push(
      `The learner is female. Where gender affects Japanese register, favor feminine speech patterns naturally — not stereotypically.`,
    )
  } else if (profile.gender) {
    parts.push(
      `The learner prefers gender-neutral language. Use neutral speech patterns — avoid strongly gendered sentence endings.`,
    )
  }

  // Experience
  if (typeof profile.experience === 'number' && profile.experience > 0) {
    const lvl = profile.experience
    if (lvl <= 2) {
      parts.push(
        `CRITICAL: This is a complete beginner (level ${lvl}/10). Use ONLY the most common, simple vocabulary. Maximum 5-7 words. No complex grammar. Favor single nouns + ください or basic verb + です patterns.`,
      )
    } else if (lvl <= 4) {
      parts.push(
        `This is a beginner (level ${lvl}/10). Keep it simple and natural. Common vocabulary, basic grammar patterns. Hiragana-heavy is fine.`,
      )
    } else if (lvl <= 6) {
      parts.push(
        `This is an intermediate learner (level ${lvl}/10). Natural conversational Japanese. Some kanji is fine. Normal politeness for the setting.`,
      )
    } else {
      parts.push(
        `This is an advanced learner (level ${lvl}/10). Natural, nuanced Japanese. Include appropriate keigo or casual register. Full kanji where natural.`,
      )
    }
  }

  return parts.join('\n')
}
