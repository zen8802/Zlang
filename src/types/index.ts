// Corridor types
export type Corridor = 'en-to-jp' | 'jp-to-en'
export type Language = 'en' | 'jp'
export type Level = 'beginner' | 'basics' | 'intermediate' | 'advanced'
export type ContentCategory = string

// Interests for EN→JP
export const EN_TO_JP_INTERESTS = [
  { id: 'anime', label: 'Anime', labelJP: 'アニメ', emoji: '🎌' },
  { id: 'manga', label: 'Manga', labelJP: 'マンガ', emoji: '📖' },
  { id: 'jpop', label: 'J-Pop', labelJP: 'J-Pop', emoji: '🎵' },
  { id: 'ghibli', label: 'Studio Ghibli', labelJP: 'スタジオジブリ', emoji: '🌿' },
  { id: 'gaming', label: 'Gaming', labelJP: 'ゲーム', emoji: '🎮' },
  { id: 'food', label: 'Japanese Food Culture', labelJP: '日本の食文化', emoji: '🍜' },
  { id: 'travel', label: 'Travel/Daily Life', labelJP: '旅行/日常生活', emoji: '✈️' },
  { id: 'jdrama', label: 'J-Drama', labelJP: 'Jドラマ', emoji: '📺' },
  { id: 'martial-arts', label: 'Martial Arts', labelJP: '武道', emoji: '⚔️' },
  { id: 'nature', label: 'Nature/Zen', labelJP: '自然/禅', emoji: '🌸' },
] as const

// Interests for JP→EN
export const JP_TO_EN_INTERESTS = [
  { id: 'nba', label: 'NBA/Sports', labelJP: 'NBA/スポーツ', emoji: '🏀' },
  { id: 'tiktok', label: 'TikTok Culture', labelJP: 'TikTok文化', emoji: '📱' },
  { id: 'hiphop', label: 'Hip-Hop', labelJP: 'ヒップホップ', emoji: '🎤' },
  { id: 'hollywood', label: 'Hollywood Movies', labelJP: 'ハリウッド映画', emoji: '🎬' },
  { id: 'youtube', label: 'YouTube Creators', labelJP: 'YouTubeクリエイター', emoji: '▶️' },
  { id: 'memes', label: 'Memes/Internet', labelJP: 'ミーム/インターネット', emoji: '💻' },
  { id: 'comedy', label: 'Stand-up Comedy', labelJP: 'スタンドアップコメディ', emoji: '😂' },
  { id: 'fashion', label: 'Street Fashion', labelJP: 'ストリートファッション', emoji: '👟' },
  { id: 'gaming', label: 'Gaming', labelJP: 'ゲーム', emoji: '🎮' },
  { id: 'american-life', label: 'American Daily Life', labelJP: 'アメリカの日常生活', emoji: '🇺🇸' },
] as const

export interface VocabItem {
  id: string
  word: string
  reading?: string       // furigana for Japanese
  meaning: string
  meaningJP?: string
  exampleSentence: string
  exampleTranslation: string
  level: Level
  categories: string[]
}

export interface ClipData {
  id: string
  youtubeId: string
  startSeconds: number
  endSeconds: number
  title: string
  titleJP: string
  language: 'japanese' | 'english'
  level: 'beginner' | 'intermediate' | 'advanced'
  categories: string[]
  transcript: string
  translation: string
  grammarPoints: string[]
  vocab: VocabItem[]
  culturalNotes: string
}

export interface LessonData {
  id: string
  unit: number
  unitTitle: string
  unitTitleJP: string
  lessonNumber: number
  title: string
  titleJP: string
  description: string
  descriptionJP: string
  clipId: string
  corridor: Corridor
  level: Level
  grammarFocus: string[]
  culturalTheme: string
  estimatedMinutes: number
  skills: SkillCategory[]
}

export type SkillCategory = 'pronunciation' | 'vocabulary' | 'grammar' | 'culture' | 'listening' | 'speaking'

export interface UserProfile {
  corridor: Corridor
  uiLanguage: Language
  interests: string[]
  level: Level
  goal: string
  dailyMinutes: number
  setupComplete: boolean
}

export interface ProgressData {
  xpToday: number
  xpTotal: number
  streak: number
  lastActiveDate: string
  lessonsCompleted: string[]
  skillLevels: Record<SkillCategory, number>
  humorIQ: number
  dojoSessions: number
}

export interface SRSEntry {
  nextReview: string
  confidence: number
  reviews: number
}

export interface SRSData {
  [vocabId: string]: SRSEntry
}

// Dojo scenarios
export interface DojoScenario {
  id: string
  title: string
  titleJP: string
  description: string
  descriptionJP: string
  emoji: string
  language: 'japanese' | 'english'
  systemPrompt: string
  difficulty: Level
}

// Claude AI response types
export interface DecodeResult {
  mainGrammarPoint: string
  culturalNote: string
  vocab: VocabItem[]
  whyThisMatters: string
  difficulty: string
  elements: {
    line: string
    timestamp: number
    literalTranslation: string
    naturalTranslation: string
    grammarExplanation: string
    culturalContext: string
    level: string
  }[]
}

export interface GradeResult {
  casualnessScore: number
  culturalFitScore: number
  naturalSlangScore: number
  grammarScore: number
  overallFeedback: string
  improvedVersion: string
  specificPraise: string
  oneThingToFix: string
}

export interface HumorClip {
  id: string
  clipId: string
  title: string
  titleJP: string
  category: string
}
