// ---------------------------------------------------------------------------
// Scenario Studio — Data & Types
// ---------------------------------------------------------------------------

export interface ScenarioTweak {
  id: string
  label: string
  type: 'select' | 'toggle' | 'text'
  options?: string[]
  defaultValue: string | boolean
  promptInjection: string
}

export interface ScenarioTemplate {
  id: string
  category: string
  categoryEmoji: string
  title: string
  titleJP: string
  description: string
  emoji: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedMinutes: number
  tags: string[]
  character: {
    /** Stable id — matches a CHARACTER_ROSTER entry where possible. */
    id?: string
    name: string
    nameJP: string
    description: string
    personality: string
    speechStyle: string
    relationship: string
    voiceId: string
    avatar: string       // path in /public e.g. '/characters/takeshi.png'
  }
  /**
   * Optional pool of alternate characters the learner can pick from before
   * starting the conversation. Each entry references a CHARACTER_ROSTER id
   * and supplies the scenario-specific relationship (since e.g. Yuki at a
   * ramen shop is a friend you ran into, not the chef). Plus the
   * scenario.character above, these form the dropdown choices.
   */
  alternates?: Array<{
    characterId: string
    relationship: string
  }>
  setting: string
  settingJP: string
  userGoal: string
  openingLine: string
  openingLineEN: string
  culturalNotes: string[]
  tweaks: ScenarioTweak[]
  color: string
  gradient: string
  /**
   * Optional ordered list of conversation beats. When present, the loop's
   * system prompt instructs the character to drive the conversation through
   * EXACTLY these beats — one beat per character turn — and to end after the
   * last beat. Used to keep loop sessions tight and goal-directed.
   */
  conversationFlow?: string[]
}

// ---------------------------------------------------------------------------
// Scenario Templates
// ---------------------------------------------------------------------------

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  // ── Food & Drink ──────────────────────────────────────────────────────
  {
    id: 'ramen-shop',
    category: 'Food & Drink',
    categoryEmoji: '🍜',
    title: 'Ramen Shop',
    titleJP: 'ラーメン屋',
    description: 'Order your bowl at a neighborhood ramen joint.',
    emoji: '🍜',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    tags: ['ordering', 'food vocab', 'counters', 'polite speech'],
    character: {
      id: 'takeshi',
      name: 'Takeshi',
      nameJP: 'たけし',
      description: 'A gruff but friendly ramen chef in his 50s who takes great pride in his tonkotsu broth.',
      personality: 'Warm, a bit loud, proud of his craft. Speaks in short, punchy sentences.',
      speechStyle: 'Casual masculine Japanese. Uses だ/だよ endings, omits particles sometimes. Throws in おう and よし.',
      relationship: 'Shop owner to customer',
      voiceId: 'JOcmGzB8OFjY8MhjHHEf',
      avatar: '/character/Takeshi.png',
    },
    alternates: [
      { characterId: 'yuki', relationship: 'A cheerful college friend you ran into at the ramen shop, eating at the counter next to you. Practice casual-polite mixed register.' },
      { characterId: 'kenji', relationship: 'A coworker who dragged you to this ramen shop after work. Practice casual-polite mix between colleagues.' },
      { characterId: 'mika', relationship: 'A close friend you came to the ramen shop with. Practice polite-feminine register with gentle, warm tone.' },
      { characterId: 'suzuki', relationship: 'Your boss treating you to dinner at this ramen shop. Practice formal business Japanese and senpai/kouhai dynamics.' },
      { characterId: 'ren', relationship: 'A gaming buddy you grabbed a quick lunch with at the ramen shop. Practice very casual masculine speech.' },
    ],
    setting: 'A small 8-seat counter ramen shop in Fukuoka. Steam rising, ticket machine by the door, hand-written specials on the wall.',
    settingJP: '福岡の小さなカウンター8席のラーメン屋。湯気が立ち上り、入口に券売機、壁に手書きのおすすめメニュー。',
    userGoal: 'Successfully order a bowl of ramen with your preferred toppings and spice level.',
    openingLine: 'いらっしゃい！一人？カウンターどこでも座っていいよ。券売機で食券買ってね。',
    openingLineEN: 'Welcome! Just one? Sit anywhere at the counter. Buy your ticket at the machine over there.',
    culturalNotes: [
      'Many ramen shops use ticket machines (券売機) — you buy a ticket before sitting down.',
      'It\'s normal and even encouraged to slurp your noodles loudly.',
      'Saying ごちそうさまでした when leaving shows appreciation.',
      '替え玉 (kaedama) means an extra serving of noodles in your remaining broth.',
    ],
    tweaks: [
      {
        id: 'formality',
        label: 'Your politeness level',
        type: 'select',
        options: ['Polite (です/ます)', 'Casual (dictionary form)', 'Super polite (keigo)'],
        defaultValue: 'Polite (です/ます)',
        promptInjection: 'The user wants to practice speaking at this politeness level: {value}. Gently correct if they use the wrong register.',
      },
      {
        id: 'menu-help',
        label: 'Menu is in Japanese only',
        type: 'toggle',
        defaultValue: true,
        promptInjection: 'If enabled, only describe menu items in Japanese. If disabled, the character offers English explanations when asked.',
      },
      {
        id: 'extras',
        label: 'Include ordering extras',
        type: 'toggle',
        defaultValue: true,
        promptInjection: 'If enabled, the chef should ask about extra toppings, noodle firmness (硬さ), and drinks.',
      },
    ],
    color: '#E85D3A',
    gradient: 'from-orange-500 to-red-500',
  },
  // ── Custom ────────────────────────────────────────────────────────────
  {
    id: 'custom',
    category: 'Custom',
    categoryEmoji: '✨',
    title: 'Your Scenario',
    titleJP: 'カスタムシナリオ',
    description: 'Create your own scenario. Describe the situation, character, and what you want to practice.',
    emoji: '✏️',
    difficulty: 'beginner',
    estimatedMinutes: 10,
    tags: ['custom', 'flexible', 'any topic'],
    character: {
      name: 'Custom Character',
      nameJP: 'カスタムキャラ',
      description: 'A character tailored to your scenario.',
      personality: 'Defined by you.',
      speechStyle: 'Defined by you.',
      relationship: 'Defined by you.',
      voiceId: 'JOcmGzB8OFjY8MhjHHEf',
      avatar: '/characters/custom.png',
    },
    setting: 'Defined by you.',
    settingJP: 'あなたが決める場所。',
    userGoal: 'Practice whatever you want in a scenario you design.',
    openingLine: '',
    openingLineEN: '',
    culturalNotes: [],
    tweaks: [
      {
        id: 'character-select',
        label: 'Choose a character',
        type: 'select',
        options: ['Takeshi (たけし) — gruff ramen chef', 'Yuki (ゆき) — cheerful student', 'Kenji (けんじ) — fun coworker', 'Mika (みか) — kind & warm', 'Mr. Suzuki (鈴木さん) — formal professional', 'Ren (れん) — upbeat gamer'],
        defaultValue: 'Takeshi (たけし) — gruff ramen chef',
        promptInjection: 'Play this character: {value}. Adopt their personality and speech style fully.',
      },
      {
        id: 'situation',
        label: 'Describe the situation',
        type: 'text',
        defaultValue: '',
        promptInjection: 'The user wants to practice this situation: {value}',
      },
      {
        id: 'setting-desc',
        label: 'Describe the setting',
        type: 'text',
        defaultValue: '',
        promptInjection: 'The setting is: {value}',
      },
      {
        id: 'difficulty-level',
        label: 'Difficulty',
        type: 'select',
        options: ['Beginner', 'Intermediate', 'Advanced'],
        defaultValue: 'Beginner',
        promptInjection: 'Adjust language complexity to {value} level.',
      },
    ],
    color: '#1B4F8A',
    gradient: 'from-blue-600 to-indigo-600',
  },
]

// ---------------------------------------------------------------------------
// Reusable character roster (for custom scenario selection)
// ---------------------------------------------------------------------------

export const CHARACTER_ROSTER = [
  { id: 'takeshi', name: 'Takeshi', nameJP: 'たけし', emoji: '🍜', voiceId: 'JOcmGzB8OFjY8MhjHHEf', avatar: '/character/Takeshi.png', description: 'Gruff but friendly ramen chef in his 50s', personality: 'Warm, loud, proud. Short punchy sentences.', speechStyle: 'Casual masculine Japanese. だ/だよ endings, omits particles.' },
  { id: 'yuki', name: 'Yuki', nameJP: 'ゆき', emoji: '🏪', voiceId: 'EkK6wL8GaH8IgBZTTDGJ', avatar: '/character/Yuki.png', description: 'Cheerful college student, curious and enthusiastic', personality: 'Energetic, giggly, asks lots of questions.', speechStyle: 'Young casual-polite. ～んですか, ～だよね, some slang.' },
  { id: 'kenji', name: 'Kenji', nameJP: 'けんじ', emoji: '🍻', voiceId: '8BU0fsFBiPt1cbGZ5lK9', avatar: '/character/Kenji.png', description: 'Outgoing coworker in his 30s who loves food', personality: 'Fun, loud after a beer, great organizer.', speechStyle: 'Casual-polite mix. ～しない？ suggestions, English loanwords.' },
  { id: 'mika', name: 'Mika', nameJP: 'みか', emoji: '💕', voiceId: 'RWZ1lnBIIgPBTpyCnKn2', avatar: '/characters/mika.png', description: 'Kind woman, warm and patient', personality: 'Gentle, thoughtful, speaks slowly and clearly.', speechStyle: 'Polite feminine Japanese. ～ですよ, ～ましょうか, のよ.' },
  { id: 'suzuki', name: 'Mr. Suzuki', nameJP: '鈴木さん', emoji: '💼', voiceId: 'SOuiRq8aXqyALuq5QIQ8', avatar: '/characters/suzuki.png', description: 'Calm professional, formal and thorough', personality: 'Serious, observant, occasionally smiles.', speechStyle: 'Formal business Japanese. ～でございます, ～いただけますか.' },
  { id: 'ren', name: 'Ren', nameJP: 'れん', emoji: '🕹️', voiceId: 'LIisRj2veIKEBdr6KZ5y', avatar: '/characters/ren.png', description: 'Upbeat young guy, passionate about games and manga', personality: 'Competitive, playful, dramatic reactions.', speechStyle: 'Very casual masculine. ～じゃん, まじかよ, やった.' },
] as const

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const SCENARIO_CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🌟' },
  { id: 'Food & Drink', label: 'Food & Drink', emoji: '🍜' },
  { id: 'Daily Life', label: 'Daily Life', emoji: '🏠' },
  { id: 'Social', label: 'Social', emoji: '👥' },
  { id: 'Pop Culture', label: 'Pop Culture', emoji: '🎮' },
  { id: 'Custom', label: 'Custom', emoji: '✨' },
]

// ---------------------------------------------------------------------------
// Difficulty Labels
// ---------------------------------------------------------------------------

export const DIFFICULTY_LABELS: Record<string, { label: string; color: 'green' | 'gold' | 'red' }> = {
  beginner: { label: 'Beginner', color: 'green' },
  intermediate: { label: 'Intermediate', color: 'gold' },
  advanced: { label: 'Advanced', color: 'red' },
}
