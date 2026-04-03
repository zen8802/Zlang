// ---------------------------------------------------------------------------
// Progress & XP Utilities
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// XP values for each lesson phase
// ---------------------------------------------------------------------------

export const XP_VALUES = {
  immersion: 10,
  decode: 15,
  shadowing: 20,
  response: 25,
  perfectLesson: 80,
} as const

// ---------------------------------------------------------------------------
// Lesson XP calculation
// ---------------------------------------------------------------------------

interface LessonPhases {
  immersion: boolean
  decode: boolean
  shadowingStars: number // 0-5
  responseGrade: string  // 'A' | 'B' | 'C' | 'D' | 'F' | ''
}

/**
 * Calculate total XP earned from a single lesson based on completed phases.
 * A "perfect lesson" bonus is awarded when all phases are completed with
 * high quality (shadowing >= 4 stars AND response grade A or B).
 */
export function calculateLessonXP(phases: LessonPhases): number {
  let xp = 0

  if (phases.immersion) {
    xp += XP_VALUES.immersion
  }

  if (phases.decode) {
    xp += XP_VALUES.decode
  }

  // Shadowing: base XP scaled by stars (0 stars = 0 XP, 5 stars = full XP)
  if (phases.shadowingStars > 0) {
    xp += Math.round(XP_VALUES.shadowing * (phases.shadowingStars / 5))
  }

  // Response: XP scaled by grade
  const gradeMultiplier: Record<string, number> = {
    A: 1.0,
    B: 0.8,
    C: 0.6,
    D: 0.4,
    F: 0.2,
  }
  if (phases.responseGrade && gradeMultiplier[phases.responseGrade] !== undefined) {
    xp += Math.round(XP_VALUES.response * gradeMultiplier[phases.responseGrade])
  }

  // Perfect lesson bonus
  const isPerfect =
    phases.immersion &&
    phases.decode &&
    phases.shadowingStars >= 4 &&
    (phases.responseGrade === 'A' || phases.responseGrade === 'B')

  if (isPerfect) {
    xp += XP_VALUES.perfectLesson
  }

  return xp
}

// ---------------------------------------------------------------------------
// Streak helpers
// ---------------------------------------------------------------------------

/**
 * Check whether the streak is still active given the last active date string
 * (YYYY-MM-DD). The streak is active if lastActiveDate is today or yesterday.
 */
export function isStreakActive(lastActiveDate: string): boolean {
  if (!lastActiveDate) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const last = new Date(lastActiveDate + 'T00:00:00')
  last.setHours(0, 0, 0, 0)

  const diffMs = today.getTime() - last.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  // Active if last was today (0) or yesterday (1)
  return diffDays >= 0 && diffDays <= 1
}

/**
 * Return a motivational streak message based on the current streak count.
 */
export function getStreakMessage(streak: number, language: 'en' | 'jp'): string {
  if (streak <= 0) {
    return language === 'en' ? 'Start your streak today!' : '今日からストリークを始めよう！'
  }
  if (streak < 3) {
    return language === 'en' ? 'Keep it going!' : 'この調子で！'
  }
  if (streak < 7) {
    return language === 'en' ? "You're on fire!" : '絶好調！'
  }
  if (streak < 30) {
    return language === 'en' ? 'Amazing dedication!' : '素晴らしい継続力！'
  }
  return language === 'en' ? "You're a legend!" : '伝説的！'
}

// ---------------------------------------------------------------------------
// Lesson content cache (Claude-generated content)
// ---------------------------------------------------------------------------

const LESSON_CACHE_KEY = 'zlang_lesson_cache'

interface LessonCache {
  [compositeKey: string]: {
    content: unknown
    cachedAt: number // timestamp
  }
}

function buildCacheKey(lessonId: string, phase: string): string {
  return `${lessonId}::${phase}`
}

function getCache(): LessonCache {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(LESSON_CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as LessonCache
  } catch {
    return {}
  }
}

function setCache(cache: LessonCache): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LESSON_CACHE_KEY, JSON.stringify(cache))
  } catch {
    console.error('[progress] Failed to write lesson cache to localStorage')
  }
}

/**
 * Retrieve cached AI-generated lesson content for a given lesson + phase.
 * Returns null if nothing is cached or the cache has expired (24 hours).
 */
export function getCachedLessonContent(lessonId: string, phase: string): unknown | null {
  const cache = getCache()
  const key = buildCacheKey(lessonId, phase)
  const entry = cache[key]

  if (!entry) return null

  // Expire after 24 hours
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
  if (Date.now() - entry.cachedAt > TWENTY_FOUR_HOURS) {
    // Clean up expired entry
    delete cache[key]
    setCache(cache)
    return null
  }

  return entry.content
}

/**
 * Store AI-generated lesson content in the local cache.
 */
export function cacheLessonContent(lessonId: string, phase: string, content: unknown): void {
  const cache = getCache()
  const key = buildCacheKey(lessonId, phase)

  cache[key] = {
    content,
    cachedAt: Date.now(),
  }

  setCache(cache)
}
