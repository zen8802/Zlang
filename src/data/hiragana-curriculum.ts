// ---------------------------------------------------------------------------
// Hiragana curriculum — the intelligence layer for beginner lesson generation.
//
// This file is hand-curated teacher knowledge, NOT auto-generated. It exists
// because random hiragana selection produces useless lessons. The diagnose API
// uses these tools to engineer backward from a target phrase the student will
// be able to USE, rather than picking disconnected characters.
// ---------------------------------------------------------------------------

// The hiragana groups in correct curriculum order.
// Each group is taught before the next. Matches the standard Japanese
// elementary-school sequence (a-row → ka-row → sa-row → ...).
export const HIRAGANA_GROUPS: Record<number, string[]> = {
  1: ['あ', 'い', 'う', 'え', 'お'],
  2: ['か', 'き', 'く', 'け', 'こ'],
  3: ['さ', 'し', 'す', 'せ', 'そ'],
  4: ['た', 'ち', 'つ', 'て', 'と'],
  5: ['な', 'に', 'ぬ', 'ね', 'の'],
  6: ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  7: ['ま', 'み', 'む', 'め', 'も'],
  8: ['や', 'ゆ', 'よ'],
  9: ['ら', 'り', 'る', 'れ', 'ろ'],
  10: ['わ', 'を', 'ん'],
}

// Dakuten/handakuten variants — counted as "available" once their base is
// available (え.g. が is available once か is in groups 1-2).
const VOICED_BASE: Record<string, string> = {
  が: 'か', ぎ: 'き', ぐ: 'く', げ: 'け', ご: 'こ',
  ざ: 'さ', じ: 'し', ず: 'す', ぜ: 'せ', ぞ: 'そ',
  だ: 'た', ぢ: 'ち', づ: 'つ', で: 'て', ど: 'と',
  ば: 'は', び: 'ひ', ぶ: 'ふ', べ: 'へ', ぼ: 'ほ',
  ぱ: 'は', ぴ: 'ひ', ぷ: 'ふ', ぺ: 'へ', ぽ: 'ほ',
}

/**
 * Returns the set of hiragana characters available at a given world.
 * World 1 = Groups 1-3, World 2 = Groups 1-4, ..., World 8+ = all.
 * Voiced variants (が, ず, etc.) are auto-included once their base is available.
 */
export function getAvailableHiragana(worldNumber: number): Set<string> {
  // World 1 starts at group 3, then +1 per world, capped at 10.
  const maxGroup = Math.min(worldNumber + 2, 10)
  const available = new Set<string>()
  for (let g = 1; g <= maxGroup; g++) {
    HIRAGANA_GROUPS[g]?.forEach((c) => available.add(c))
  }
  // Add voiced/handakuten variants for all base chars now available
  for (const [variant, base] of Object.entries(VOICED_BASE)) {
    if (available.has(base)) available.add(variant)
  }
  return available
}

/**
 * True if every character in the phrase can be written using only the
 * available hiragana set, plus katakana (always allowed for loanwords),
 * plus the small set of always-allowed punctuation/marks. Kanji = false
 * because beginners never produce kanji.
 */
export function isPhraseFeasible(phrase: string, available: Set<string>): boolean {
  for (const char of phrase) {
    const code = char.charCodeAt(0)
    const isHiragana = code >= 0x3041 && code <= 0x3096
    const isKatakana = code >= 0x30a0 && code <= 0x30ff
    const isKanji = code >= 0x4e00 && code <= 0x9fff
    const isAlwaysAllowed = ['、', '。', '！', '？', 'ー', '・', 'っ', 'ん', ' ', '　'].includes(char)

    if (isAlwaysAllowed) continue
    if (isKatakana) continue
    if (isKanji) return false
    if (isHiragana && !available.has(char)) return false
  }
  return true
}

/**
 * Returns the hiragana characters in `phrase` that are NOT yet in `alreadyKnown`,
 * preserving first-appearance order, deduplicated.
 */
export function getNewHiragana(phrase: string, alreadyKnown: Set<string>): string[] {
  const newChars: string[] = []
  const seen = new Set<string>()
  for (const char of phrase) {
    const code = char.charCodeAt(0)
    const isHiragana = code >= 0x3041 && code <= 0x3096
    if (isHiragana && !alreadyKnown.has(char) && !seen.has(char)) {
      newChars.push(char)
      seen.add(char)
    }
  }
  return newChars
}

// ---------------------------------------------------------------------------
// Target phrases per scenario — the priority list a teacher would use.
// First feasible phrase wins. Phrases are ranked by real-world utility.
// ---------------------------------------------------------------------------

export interface TargetPhrase {
  /** The phrase, in hiragana/katakana — what the student will assemble. */
  phrase: string
  /** Same as phrase for kana-only entries. */
  reading: string
  /** English translation. */
  english: string
  /** Why this matters — shown to the student as the "win" line. */
  whyItMatters: string
  /** Hiragana groups required to write this phrase. */
  requiredGroups: number[]
  /** Optional how-to-remember hint. */
  mnemonic?: string
}

export const WORLD_TARGET_PHRASES: Record<string, TargetPhrase[]> = {
  'ramen-shop': [
    {
      phrase: 'ありがとう',
      reading: 'ありがとう',
      english: 'thank you',
      whyItMatters:
        "You'll say this every single time you leave a shop, restaurant, or receive anything in Japan.",
      requiredGroups: [1, 2, 4, 9],
      mnemonic:
        'あ(a) り(ri) が(ga) と(to) う(u) — five characters, one of the most important phrases in Japanese',
    },
    {
      phrase: 'おいしい',
      reading: 'おいしい',
      english: 'delicious',
      whyItMatters:
        'Saying this after your first bite makes the chef genuinely happy. Expected and appreciated.',
      requiredGroups: [1, 3],
      mnemonic: 'お(o) い(i) し(shi) い(i) — mostly vowels, very easy to remember',
    },
    {
      phrase: 'これ',
      reading: 'これ',
      english: 'this one',
      whyItMatters:
        'Point and say これ — you can order almost anything in Japan with just this word.',
      requiredGroups: [2, 9],
    },
    {
      phrase: 'すみません',
      reading: 'すみません',
      english: 'excuse me',
      whyItMatters:
        "How you get a server's attention in Japan. Never shout — just すみません.",
      requiredGroups: [3, 5, 7, 10],
    },
  ],

  // Kept for default-fallback purposes — these scenarios are not in the
  // current SCENARIO_TEMPLATES list but the curriculum should remain robust
  // for any future scenarios with these IDs.
  'convenience-store': [
    {
      phrase: 'いくら',
      reading: 'いくら',
      english: 'how much?',
      whyItMatters: 'Two characters. Ask the price of literally anything.',
      requiredGroups: [1, 2, 9],
    },
    {
      phrase: 'ありがとう',
      reading: 'ありがとう',
      english: 'thank you',
      whyItMatters: 'Works everywhere. Always appropriate.',
      requiredGroups: [1, 2, 4, 9],
    },
  ],

  default: [
    {
      phrase: 'ありがとう',
      reading: 'ありがとう',
      english: 'thank you',
      whyItMatters: 'The most useful phrase in Japanese. Period.',
      requiredGroups: [1, 2, 4, 9],
    },
    {
      phrase: 'おいしい',
      reading: 'おいしい',
      english: 'delicious',
      whyItMatters: 'Works in almost any food context.',
      requiredGroups: [1, 3],
    },
  ],
}

/**
 * Pick the optimal target phrase for this student, preferring phrases that
 * introduce something new (so we don't re-teach the same thing every loop).
 * Falls back to the simplest default if nothing in the scenario list fits.
 */
export function selectTargetPhrase(
  scenarioId: string,
  worldNumber: number,
  alreadyKnownHiragana: Set<string>,
): TargetPhrase | null {
  const available = getAvailableHiragana(worldNumber)
  const candidates =
    WORLD_TARGET_PHRASES[scenarioId] || WORLD_TARGET_PHRASES['default']

  // First pass: feasible AND introduces at least one new character
  for (const phrase of candidates) {
    if (!isPhraseFeasible(phrase.phrase, available)) continue
    const newChars = getNewHiragana(phrase.phrase, alreadyKnownHiragana)
    if (newChars.length > 0) return phrase
  }
  // Second pass: any feasible phrase (review mode)
  for (const phrase of candidates) {
    if (isPhraseFeasible(phrase.phrase, available)) return phrase
  }
  // Last resort
  return WORLD_TARGET_PHRASES['default'][0] || null
}

// ---------------------------------------------------------------------------
// Per-character mnemonics — widely-used visual hooks. Used by the diagnose
// prompt to seed the hiragana_intro block with high-quality memory hooks
// instead of letting Claude invent mediocre ones.
// ---------------------------------------------------------------------------

export const HIRAGANA_MNEMONICS: Record<string, string> = {
  あ: 'Looks like an "a" — the mouth opening wide',
  い: 'Two people standing — "ee" sound',
  う: 'Lips puckered to say "oo"',
  え: 'Like the letter E with a hat',
  お: 'An "o" shape with a flick',
  か: 'A person with a sword — "ka!" strike',
  き: 'A key — "ki"',
  く: 'A bird beak saying "ku"',
  け: 'Looks like a katakana ケ',
  こ: 'Two strokes like a "co-" prefix',
  さ: 'Like a cross + fish hook — "sa"',
  し: 'Looks like a fishhook — "she" sound',
  す: 'A swing — "su"',
  せ: 'Like "se-" in "set"',
  そ: 'A curvy "so"',
  た: 'Looks like a ta-da pose',
  ち: 'Like a cartoon face — "chi"',
  つ: 'Like a wave — "tsu"',
  て: 'Like a hand — "te" as in "ten"',
  と: 'Like a toe with a line — "to"',
  な: 'Like "na-na-na" humming',
  に: 'Two lines like "ni" (Japanese for 2)',
  ぬ: 'Looks like noodles — "nu"',
  ね: 'Like a sleeping cat — "ne"',
  の: 'A swirl — "no" like saying no',
  は: 'Like a flag — "ha"',
  ひ: 'A smile — "hi"',
  ふ: 'Like a Mt Fuji silhouette — "fu"',
  へ: 'A hill — "he"',
  ほ: 'は with an extra leg — "ho"',
  ま: 'Like the letter "ma" mirrored',
  み: 'Looks like 21 (mi = 3 in Japanese counts)',
  む: 'A cow — "moo" → "mu"',
  め: 'An eye — "me" (Japanese for eye)',
  も: 'A fishing hook with worms — "mo"',
  や: '"ya!" like a karate yell',
  ゆ: 'A unique "u" with a bar — "yu"',
  よ: 'Looks like a yo-yo — "yo"',
  ら: 'Like a running figure — "ra"',
  り: 'Two strokes — "ri" as in "ree"',
  る: 'A loop on a stick — "ru"',
  れ: 'Like ね with no curl — "re"',
  ろ: 'A road curving — "ro"',
  わ: 'A scarf around someone — "wa"',
  を: 'A person carrying something — particle "wo/o"',
  ん: 'Just one stroke — "n"',
  // Voiced variants
  が: 'か + dakuten (") = voiced "ga"',
  ぎ: 'き + dakuten (") = voiced "gi"',
  ぐ: 'く + dakuten (") = voiced "gu"',
  げ: 'け + dakuten (") = voiced "ge"',
  ご: 'こ + dakuten (") = voiced "go"',
  ざ: 'さ + dakuten (") = voiced "za"',
  じ: 'し + dakuten (") = voiced "ji"',
  ず: 'す + dakuten (") = voiced "zu"',
  ぜ: 'せ + dakuten (") = voiced "ze"',
  ぞ: 'そ + dakuten (") = voiced "zo"',
  だ: 'た + dakuten (") = voiced "da"',
  で: 'て + dakuten (") = voiced "de"',
  ど: 'と + dakuten (") = voiced "do"',
  ば: 'は + dakuten (") = voiced "ba"',
  び: 'ひ + dakuten (") = voiced "bi"',
  ぶ: 'ふ + dakuten (") = voiced "bu"',
  べ: 'へ + dakuten (") = voiced "be"',
  ぼ: 'ほ + dakuten (") = voiced "bo"',
}

// ---------------------------------------------------------------------------
// Romaji table — used by the diagnose API when seeding the hiragana_intro
// block with character data so Claude doesn't have to guess romaji.
// ---------------------------------------------------------------------------

export const HIRAGANA_ROMAJI: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'wo', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
}
