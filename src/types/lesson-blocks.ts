// ──────────────────────────────────────────────
// Lesson Block Type System
// ──────────────────────────────────────────────

/** Base fields shared by every block */
export interface BaseBlock {
  id: string
  type: string
  order: number
  xpReward: number
}

// ── Flashcard ────────────────────────────────

export interface FlashcardCard {
  word: string
  reading: string
  romaji: string
  english: string
  partOfSpeech: string
  jlptLevel: string
  exampleJP: string
  exampleEN: string
  memoryHook: string
}

export interface FlashcardBlock extends BaseBlock {
  type: 'flashcard'
  cards: FlashcardCard[]
}

// ── Sentence ─────────────────────────────────

export interface KeywordAnnotation {
  word: string
  reading: string
  meaning: string
  jlptLevel: string
  example: string
}

export interface Sentence {
  id: string
  japanese: string
  romaji: string
  english: string
  keywords: KeywordAnnotation[]
  grammarNote: string
  emotionTag: string
}

export interface SentenceBlock extends BaseBlock {
  type: 'sentence'
  sentences: Sentence[]
}

// ── Quiz ─────────────────────────────────────

export interface QuizOption {
  text: string
  isCorrect: boolean
}

export interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'true_false'
  prompt: string
  options: QuizOption[]
  explanation: string
}

export interface QuizBlock extends BaseBlock {
  type: 'quiz'
  questions: QuizQuestion[]
}

// ── Fill-in-the-Blank ────────────────────────

export interface FillBlankSentence {
  id: string
  before: string
  answer: string
  after: string
  hint: string
  explanation: string
}

export interface FillBlankBlock extends BaseBlock {
  type: 'fill_blank'
  sentences: FillBlankSentence[]
}

// ── Translation ──────────────────────────────

export interface TranslationItem {
  id: string
  source: string
  sourceLanguage: 'ja' | 'en'
  acceptedAnswers: string[]
  explanation: string
}

export interface TranslationBlock extends BaseBlock {
  type: 'translation'
  items: TranslationItem[]
}

// ── Reading ──────────────────────────────────

export interface ComprehensionQuestion {
  id: string
  question: string
  options: QuizOption[]
  explanation: string
}

export interface ReadingBlock extends BaseBlock {
  type: 'reading'
  passage: string
  passageTranslation: string
  comprehensionQuestions: ComprehensionQuestion[]
}

// ── Matching ─────────────────────────────────

export interface MatchingPair {
  id: string
  left: string   // Japanese
  right: string  // English
}

export interface MatchingBlock extends BaseBlock {
  type: 'matching'
  pairs: MatchingPair[]
}

// ── Culture Note ─────────────────────────────

export interface CultureNoteBlock extends BaseBlock {
  type: 'culture_note'
  emoji: string
  headline: string
  body: string
  neverInTextbook: string
  relatedWords: string[]
}

// ── Shadowing ────────────────────────────────

export interface ShadowingChunk {
  japanese: string
  romaji: string
  english: string
}

export interface ShadowingBlock extends BaseBlock {
  type: 'shadowing'
  targetSentence: string
  targetRomaji: string
  targetEnglish: string
  breakdown: ShadowingChunk[]
}

// ── Video ────────────────────────────────────

export interface VideoBlock extends BaseBlock {
  type: 'video'
  clipId: string
  instruction: string
}

// ── Union Type ───────────────────────────────

export type LessonBlock =
  | FlashcardBlock
  | SentenceBlock
  | QuizBlock
  | FillBlankBlock
  | TranslationBlock
  | ReadingBlock
  | MatchingBlock
  | CultureNoteBlock
  | ShadowingBlock
  | VideoBlock

// ── Lesson ───────────────────────────────────

export interface Lesson {
  id: string
  title: string
  titleJP: string
  description: string
  jlptLevel: string
  unit: number
  order: number
  estimatedMinutes: number
  targetLanguage: 'ja' | 'en'
  blocks: LessonBlock[]
  totalXP: number
  tags: string[]
  isPublished: boolean
}

// ── Progress ─────────────────────────────────

export interface BlockProgress {
  blockId: string
  completed: boolean
  xpEarned: number
  attempts: number
  accuracy: number
  completedAt: string | null
}

export interface LessonProgress {
  lessonId: string
  userId: string
  started: boolean
  completed: boolean
  currentBlockIndex: number
  blockProgress: BlockProgress[]
  totalXPEarned: number
  startedAt: string | null
  completedAt: string | null
}
