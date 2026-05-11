/**
 * Kanji Level Progression
 *
 * Every conversation and lesson sent to the model is constrained by an
 * explicit list of permitted kanji. This is the single source of truth.
 *
 * Why: prior "use appropriate kanji" prompting was ignored under pressure.
 * Giving the model a finite character whitelist + an unambiguous fallback
 * rule (write in kana if not on the list) is dramatically more reliable.
 *
 * Levels:
 *   1 — Grade 1 only (80 kanji)
 *   2 — Grade 1-2 (240 kanji)
 *   3 — Grade 1-3 (440 kanji)            [reserved for later]
 *   4 — Grade 1-6 / full Kyōiku (1026)   [reserved for later]
 *   5 — Jōyō kanji (2136)                [reserved for later]
 *
 * Gate to advance: 65% of the *current grade's* kanji learned (gold).
 */

export const GRADE_1_KANJI_STRING =
  '一二三四五六七八九十日月火水木金土山川田人口目耳手足力大小中上下左右本文字学校先生気天空雨花草虫犬貝車糸林森正王玉石竹米見音年早名白赤青円入出立休子女男'

export const GRADE_2_KANJI_STRING =
  '引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話'

/**
 * Cumulative kanji per level. Keyed by level number; value is the exact
 * character set the AI is permitted to use. Injected verbatim into prompts.
 */
export const LEVEL_KANJI: Record<number, string> = {
  1: GRADE_1_KANJI_STRING,
  2: GRADE_1_KANJI_STRING + GRADE_2_KANJI_STRING,
  // 3+ to be added when grade 3 data is ready
}

/**
 * Cached Set form for fast lookups (used by the post-processor safety net).
 */
const LEVEL_KANJI_SETS: Record<number, Set<string>> = {}
export function getLevelKanjiSet(level: number): Set<string> {
  if (!LEVEL_KANJI_SETS[level]) {
    const str = LEVEL_KANJI[level] || GRADE_1_KANJI_STRING
    LEVEL_KANJI_SETS[level] = new Set(str.split(''))
  }
  return LEVEL_KANJI_SETS[level]
}

/**
 * Per-level gate config. The user must learn `percentage` of their current
 * grade's kanji (NOT cumulative) before advancing.
 */
export const LEVEL_GATES: Record<
  number,
  { requiredGrade: number; percentage: number; description: string }
> = {
  1: {
    requiredGrade: 1,
    percentage: 0.65,
    description: 'Learn 65% of Grade 1 kanji to unlock Level 2',
  },
  2: {
    requiredGrade: 2,
    percentage: 0.65,
    description: 'Learn 65% of Grade 2 kanji to unlock Level 3',
  },
}

export const GRADE_SIZES: Record<number, number> = {
  1: 80,
  2: 160,
  3: 200,
  4: 202,
  5: 193,
  6: 191,
}

const GRADE_KANJI_STRINGS: Record<number, string> = {
  1: GRADE_1_KANJI_STRING,
  2: GRADE_2_KANJI_STRING,
}

export interface LevelGateResult {
  canAdvance: boolean
  progress: number
  required: number
  percentage: number
  nextLevel: number | null
}

/**
 * Compute progress toward the next level. `progress` and `required` count
 * only the current grade's kanji — not cumulative — so a Level 1 user sees
 * their progress against the 80 Grade 1 characters.
 */
export function checkLevelGate(currentLevel: number, discoveredKanji: string[]): LevelGateResult {
  const gate = LEVEL_GATES[currentLevel]
  if (!gate) {
    return { canAdvance: false, progress: 0, required: 0, percentage: 0, nextLevel: null }
  }

  const gradeString = GRADE_KANJI_STRINGS[gate.requiredGrade]
  if (!gradeString) {
    return { canAdvance: false, progress: 0, required: 0, percentage: 0, nextLevel: null }
  }

  const gradeSet = new Set(gradeString.split(''))
  const learnedInGrade = discoveredKanji.filter((k) => gradeSet.has(k)).length
  const required = Math.ceil(gradeSet.size * gate.percentage)
  const percentage = gradeSet.size === 0 ? 0 : learnedInGrade / gradeSet.size

  return {
    canAdvance: learnedInGrade >= required,
    progress: learnedInGrade,
    required,
    percentage,
    nextLevel: currentLevel + 1,
  }
}

/**
 * Walk gates from Level 1 upward and return the highest level the user has
 * earned given their learned kanji. Display-side helper only — the canonical
 * `kanji_level` lives on the users row and is the source of truth for the AI.
 */
export function deriveKanjiLevel(discoveredKanji: string[]): number {
  let level = 1
  // Safety bound: stop at the highest gate we have configured.
  while (LEVEL_GATES[level]) {
    const gate = checkLevelGate(level, discoveredKanji)
    if (!gate.canAdvance || !gate.nextLevel) break
    level = gate.nextLevel
  }
  return level
}

/**
 * The exact prompt text injected into every AI call. The character list is
 * verbatim so the model can scan and match each kanji it considers writing.
 */
export function buildKanjiConstraint(level: number): string {
  const permitted = LEVEL_KANJI[level] || GRADE_1_KANJI_STRING

  return `KANJI LEVEL CONSTRAINT — STRICTLY ENFORCED
The student is at Kanji Level ${level}.
The ONLY kanji you may use are: ${permitted}

⚠️ TWO RULES, BOTH MANDATORY ⚠️

RULE 1 — WHICH KANJI YOU MAY USE:
For ANY word containing a kanji NOT in the permitted list, write the entire
word in hiragana (or katakana for loanwords) instead. Furigana on a forbidden
kanji does not exempt it — the kanji itself must not appear.

  WRONG: 準備                  → 準, 備 not permitted
  RIGHT: じゅんび
  WRONG: 電車                  → 電 not permitted (even though 車 is)
  RIGHT: でんしゃ
  WRONG: 食べる                → 食 not permitted
  RIGHT: たべる

RULE 2 — EVERY PERMITTED KANJI MUST HAVE FURIGANA:
Whenever you DO use a permitted kanji, you MUST attach its hiragana reading
inline in this exact format: 漢字(かんじ). Never write a bare kanji.

  WRONG: 来た                  → bare kanji, no furigana
  RIGHT: 来(き)た
  WRONG: 大きい                → bare kanji, no furigana
  RIGHT: 大(おお)きい
  WRONG: 山田さん              → bare kanji, no furigana
  RIGHT: 山田(やまだ)さん
  WRONG: 今日(きょう)は天気がいい  → only 今日 has furigana, 天気 doesn't
  RIGHT: 今日(きょう)は天気(てんき)がいい

This applies to EVERY kanji in EVERY message — dialogue, vocab entries,
example sentences, romaji breakdowns, coach notes. No exceptions.

Before writing each kanji ask yourself two questions:
  1. "Is this character in the permitted list?" If not, use kana.
  2. "Did I attach its furigana reading?" If not, add it.`
}
