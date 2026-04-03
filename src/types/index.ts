// Corridor types
export type Corridor = 'en-to-jp' | 'jp-to-en'
export type Language = 'en' | 'jp'
export type Level = 'beginner' | 'basics' | 'intermediate' | 'advanced'
export type ContentCategory = string

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
  searchQuery?: string
  channelId?: string
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
  level: Level
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
