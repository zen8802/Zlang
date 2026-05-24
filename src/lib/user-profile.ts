/**
 * Demographic-aware language profile.
 *
 * This module is the single source of truth for how a user's gender, birth
 * year, and experience level shape:
 *   - the Japanese the AI character speaks TO them (characterStyle)
 *   - the Japanese the auto-translate produces FOR them (translationStyle)
 *   - the speech register applied across every AI surface (speechStyle)
 *
 * Age is COMPUTED from birthYear at request time; we never store age. This
 * keeps the row stable as the user ages — no nightly reconciliation needed.
 */

export type Gender = 'male' | 'female' | 'other'
export type AgeGroup = 'teen' | 'young_adult' | 'adult' | 'senior'

export interface UserDemographic {
  gender: Gender
  birthYear: number
  age: number            // computed, never stored
  experienceLevel: number
  ageGroup: AgeGroup
}

export interface LanguageProfile {
  demographic: UserDemographic
  speechStyle: string      // injected into every AI prompt — how the user should sound
  translationStyle: string // translation-route-specific rules
  characterStyle: string   // how the AI character should speak TO this user
}

export function computeAge(birthYear: number): number {
  const year = new Date().getFullYear()
  const age = year - (birthYear || year)
  // Clamp into a sane range so a missing/bogus value can't crash downstream.
  if (!Number.isFinite(age)) return 25
  return Math.max(0, Math.min(120, age))
}

export function getAgeGroup(age: number): AgeGroup {
  if (age < 20) return 'teen'
  if (age < 35) return 'young_adult'
  if (age < 60) return 'adult'
  return 'senior'
}

function normalizeGender(g: string | null | undefined): Gender {
  if (g === 'male' || g === 'female') return g
  return 'other'
}

/**
 * Build the full language profile from raw user data.
 * Safe to call with partially-missing data — falls back to neutral defaults.
 */
export function buildLanguageProfile(user: {
  gender?: string | null
  birthYear?: number | null
  experienceLevel?: number | null
}): LanguageProfile {
  const birthYear = user.birthYear || 1995
  const age = computeAge(birthYear)
  const ageGroup = getAgeGroup(age)
  const gender = normalizeGender(user.gender)
  const experienceLevel = typeof user.experienceLevel === 'number' ? user.experienceLevel : 3

  const demographic: UserDemographic = {
    gender,
    birthYear,
    age,
    experienceLevel,
    ageGroup,
  }

  return {
    demographic,
    speechStyle: buildSpeechStyle(gender, ageGroup),
    translationStyle: buildTranslationStyle(gender, ageGroup),
    characterStyle: buildCharacterStyle(gender, ageGroup),
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Speech style — applied to ALL Japanese generation for the user
// ──────────────────────────────────────────────────────────────────────────

function buildSpeechStyle(gender: Gender, ageGroup: AgeGroup): string {
  const styles: Record<string, string> = {
    'male-teen': `
Casual, energetic, slightly rough around the edges.
Use だ/である endings sometimes. Drop politeness markers
in casual contexts. Use ore (俺) as first person.
Avoid overly polite forms — they sound unnatural for
a young male speaker.`,

    'male-young_adult': `
Casual but respectful. This is the most common register
for a foreign learner — polite enough for strangers,
relaxed enough to sound natural.
Use です/ます for new acquaintances and service staff.
Drop to だ/plain form with peers.
Avoid overly formal keigo — it sounds stiff.
Do NOT use うん as an affirmative — use ええ or はい.`,

    'male-adult': `
Direct, composed. Uses です/ます naturally with service staff.
Does not add softeners or hedging unnecessarily.
Comfortable with a firm はい or ええ as affirmatives.
Avoids sounding either too casual or too formal.`,

    'male-senior': `
Measured, traditional. Naturally formal in public settings.
Uses はい clearly. Might use more formal vocabulary
than younger speakers. Direct without being brusque.`,

    'female-teen': `
Energetic, warm. May use あたし as first person.
Uses ね and よ sentence endings naturally.
Polite but not stiff — ありがとうございます feels natural,
not forced.`,

    'female-young_adult': `
Warm, polite, socially fluent. This is the register
most associated with smooth social interaction in Japanese.
Uses です/ます naturally. Sentence endings with ね add
warmth without sounding weak. Use わたし as first person.
Do NOT use うん — use はい or ええ with service staff.
Slightly softer affirmatives: はい、それで大丈夫です
rather than just はい.`,

    'female-adult': `
Composed, polite. Comfortable in all registers.
Clear はい with service staff. Natural politeness
without excessive hedging. Direct when appropriate.`,

    'female-senior': `
Formal and gracious. Very natural in polite registers.
Might use slightly older-fashioned politeness patterns.
Very clear はい, full sentence forms preferred.`,

    'other-teen': `
Casual but polite. Uses です/ます with service staff.
Clear affirmatives — はい or ええ rather than うん.
Avoid strongly gendered sentence endings.`,

    'other-young_adult': `
Polite, natural. Uses です/ます with service staff
and strangers. Clear affirmatives — はい or ええ
rather than うん. Balanced register that works
across most social situations. Avoid strongly gendered
particles (no ぞ/ぜ, no わ/のよ).`,

    'other-adult': `
Polite, composed. です/ます naturally with strangers.
Clear はい. Avoid strongly gendered sentence endings.`,

    'other-senior': `
Formal, gracious. Comfortable in polite registers.
Clear はい. Avoid strongly gendered particles.`,
  }

  const key = `${gender}-${ageGroup}`
  return styles[key] || styles['other-young_adult']
}

// ──────────────────────────────────────────────────────────────────────────
// Translation style — only injected into the translate-response API
// ──────────────────────────────────────────────────────────────────────────

function buildTranslationStyle(gender: Gender, ageGroup: AgeGroup): string {
  const ageLabel =
    ageGroup === 'teen' ? 'teenage' :
    ageGroup === 'young_adult' ? 'young adult' :
    ageGroup === 'adult' ? 'adult' : 'older'
  const genderLabel = gender === 'other' ? 'person' : gender

  return `
TRANSLATION REGISTER — CRITICAL:
Translate the user's English as a real ${ageLabel} ${genderLabel} speaker
of Japanese would say it.

Specific rules:
- NEVER use うん as an affirmative with service staff, strangers, or in
  restaurants/shops. Use はい or ええ instead.
- NEVER use お前 or 貴様 as second person.
- Use ${gender === 'female' ? 'わたし' : gender === 'male' ? '僕 or 俺 (僕 in polite contexts, 俺 only with close peers)' : 'わたし'} as first person.
- です/ます form is default for all service interactions
  (ordering food, asking directions, shopping).
- Plain form only for very casual settings with peers.
- Contractions and casual speech only when the conversation is clearly
  between close friends.
- Match the EMOTIONAL register of the English input:
  "Yeah sure" → ええ、それで大丈夫です (not うん)
  "Yes please" → はい、お願いします
  "I want the spicy one" → 辛いのをください
  "That sounds good" → それがいいですね

If the English is casual, translate to appropriately casual Japanese — but
casual Japanese still uses appropriate social register for the context.
A ramen shop is NOT a casual context with a close friend.
`.trim()
}

// ──────────────────────────────────────────────────────────────────────────
// Character style — how the AI character should speak TO this user
// ──────────────────────────────────────────────────────────────────────────

function buildCharacterStyle(gender: Gender, ageGroup: AgeGroup): string {
  const ageDescriptor =
    ageGroup === 'teen' ? '10代の学生' :
    ageGroup === 'young_adult' ? '20〜30代の若者' :
    ageGroup === 'adult' ? '成人' :
    '年配の方'

  const genderDescriptor =
    gender === 'male' ? '男性' :
    gender === 'female' ? '女性' :
    '人'

  return `
LEARNER PROFILE FOR CHARACTER SPEECH:
The user is ${ageDescriptor} (${genderDescriptor}).
Adjust your speech to them accordingly:
- For teens: slightly looser, more energetic.
- For young adults: natural casual-polite (tameguchi with slight politeness).
- For adults: respectful, full polite forms with familiar warmth.
- For seniors: respectful, full polite forms, no slang.
Do not speak down to any age group.
Do not be overly formal to young users — it sounds strange.
`.trim()
}

// ──────────────────────────────────────────────────────────────────────────
// Back-compat shim
// ──────────────────────────────────────────────────────────────────────────

/**
 * Older callers used a single "buildProfileContext" string that mashed
 * everything together. This wraps the new builder to return that legacy
 * format so existing prompts don't break while we migrate.
 */
export function buildLegacyProfileContext(user: {
  gender?: string | null
  birthYear?: number | null
  experienceLevel?: number | null
}): string {
  const profile = buildLanguageProfile(user)
  return [
    profile.characterStyle,
    profile.speechStyle.trim(),
  ].filter(Boolean).join('\n\n')
}
