// ---------------------------------------------------------------------------
// Spaced Repetition System (SRS) using localStorage
// ---------------------------------------------------------------------------

import { SRSData, SRSEntry } from '@/types'

const SRS_KEY = 'zlang_srs'

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/**
 * Read the full SRS dataset from localStorage.
 */
export function getSRSData(): SRSData {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(SRS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as SRSData
  } catch {
    return {}
  }
}

/**
 * Persist the full SRS dataset to localStorage.
 */
export function saveSRSData(data: SRSData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SRS_KEY, JSON.stringify(data))
  } catch {
    console.error('[SRS] Failed to save SRS data to localStorage')
  }
}

/**
 * Record a review for a vocabulary item.
 *
 * Confidence levels:
 *   1 = Hard  -> review tomorrow
 *   2 = OK    -> review in 3 days
 *   3 = Easy  -> review in 7 days
 */
export function recordReview(vocabId: string, confidence: 1 | 2 | 3): void {
  const data = getSRSData()
  const today = todayStr()

  const intervalMap: Record<1 | 2 | 3, number> = {
    1: 1,
    2: 3,
    3: 7,
  }

  const existing = data[vocabId]
  const reviews = existing ? existing.reviews + 1 : 1

  data[vocabId] = {
    nextReview: addDays(today, intervalMap[confidence]),
    confidence,
    reviews,
  }

  saveSRSData(data)
}

/**
 * Return an array of vocab IDs that are due for review today (or overdue).
 */
export function getDueReviews(): string[] {
  const data = getSRSData()
  const today = todayStr()

  return Object.entries(data)
    .filter(([, entry]) => entry.nextReview <= today)
    .map(([vocabId]) => vocabId)
}

/**
 * Get the SRS stats for a single vocabulary item, or null if not tracked.
 */
export function getVocabStats(vocabId: string): SRSEntry | null {
  const data = getSRSData()
  return data[vocabId] ?? null
}
