import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserProfile {
  direction: 'en-to-jp' | 'jp-to-en'
  age: number | null
  gender: string | null
  experience: number // 1-10
}

interface AppState {
  // Onboarding profile (age/gender/experience/direction) — used to tune AI translations
  userProfile: UserProfile | null

  // Hiragana the learner has been formally introduced to via a hiragana_intro
  // block. Used by the diagnose API to engineer the next lesson backward from
  // a target phrase. Persisted to Clerk unsafeMetadata.knownHiragana so it
  // survives across devices.
  knownHiragana: string[]
  worldNumber: number

  // User profile
  corridor: 'en-to-jp' | 'jp-to-en' | null
  uiLanguage: 'en' | 'jp'
  level: '' | 'beginner' | 'basics' | 'intermediate' | 'advanced'

  // Progress
  xpToday: number
  xpTotal: number
  streak: number
  lastActiveDate: string
  lessonsCompleted: string[]
  skillLevels: Record<string, number> // 0-5 for each skill
  humorIQ: number
  dojoSessions: number

  // Learning preferences
  showFurigana: boolean
  showTranslation: boolean

  // Actions
  setUserProfile: (profile: UserProfile) => void
  addKnownHiragana: (chars: string[]) => void
  setKnownHiragana: (chars: string[]) => void
  setWorldNumber: (n: number) => void
  setCorridor: (corridor: 'en-to-jp' | 'jp-to-en') => void
  setUiLanguage: (lang: 'en' | 'jp') => void
  setLevel: (level: '' | 'beginner' | 'basics' | 'intermediate' | 'advanced') => void
  addXP: (amount: number) => void
  completeLesson: (lessonId: string) => void
  updateSkill: (skill: string, amount: number) => void
  updateStreak: () => void
  incrementHumorIQ: (amount: number) => void
  incrementDojoSessions: () => void
  setShowFurigana: (show: boolean) => void
  setShowTranslation: (show: boolean) => void
  resetProgress: () => void
  resetAll: () => void
}

// ---------------------------------------------------------------------------
// Date helpers (no external library)
// ---------------------------------------------------------------------------

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Initial state values
// ---------------------------------------------------------------------------

const initialState = {
  userProfile: null as UserProfile | null,
  knownHiragana: [] as string[],
  worldNumber: 1,
  corridor: null as 'en-to-jp' | 'jp-to-en' | null,
  uiLanguage: 'en' as 'en' | 'jp',
  level: '' as '' | 'beginner' | 'basics' | 'intermediate' | 'advanced',

  xpToday: 0,
  xpTotal: 0,
  streak: 0,
  lastActiveDate: '',
  lessonsCompleted: [] as string[],
  skillLevels: {
    pronunciation: 0,
    vocabulary: 0,
    grammar: 0,
    culture: 0,
    listening: 0,
    speaking: 0,
  } as Record<string, number>,
  humorIQ: 0,
  dojoSessions: 0,
  showFurigana: true,
  showTranslation: true,
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // -- Profile actions ----------------------------------------------------

      setUserProfile: (profile) =>
        set({
          userProfile: profile,
          // Mirror the direction into corridor so the rest of the app stays in sync
          corridor: profile.direction,
        }),

      addKnownHiragana: (chars) =>
        set((state) => {
          const next = new Set(state.knownHiragana)
          for (const c of chars) next.add(c)
          return { knownHiragana: Array.from(next) }
        }),

      setKnownHiragana: (chars) =>
        set({ knownHiragana: Array.from(new Set(chars)) }),

      setWorldNumber: (n) => set({ worldNumber: n }),

      setCorridor: (corridor) => set({ corridor }),

      setUiLanguage: (lang) => set({ uiLanguage: lang }),

      setLevel: (level) => set({ level }),

      // -- Progress actions ---------------------------------------------------

      addXP: (amount) =>
        set((state) => ({
          xpToday: state.xpToday + amount,
          xpTotal: state.xpTotal + amount,
        })),

      completeLesson: (lessonId) =>
        set((state) => ({
          lessonsCompleted: state.lessonsCompleted.includes(lessonId)
            ? state.lessonsCompleted
            : [...state.lessonsCompleted, lessonId],
        })),

      updateSkill: (skill, amount) =>
        set((state) => ({
          skillLevels: {
            ...state.skillLevels,
            [skill]: Math.min(5, Math.max(0, (state.skillLevels[skill] ?? 0) + amount)),
          },
        })),

      updateStreak: () => {
        const { lastActiveDate, streak } = get()
        const today = todayStr()
        const yesterday = yesterdayStr()

        if (lastActiveDate === today) {
          // Already active today — nothing to do
          return
        }

        if (lastActiveDate === yesterday) {
          // Continue the streak
          set({ streak: streak + 1, lastActiveDate: today, xpToday: 0 })
        } else {
          // Streak broken (or first ever session) — reset to 1
          set({ streak: 1, lastActiveDate: today, xpToday: 0 })
        }
      },

      incrementHumorIQ: (amount) =>
        set((state) => ({ humorIQ: state.humorIQ + amount })),

      incrementDojoSessions: () =>
        set((state) => ({ dojoSessions: state.dojoSessions + 1 })),

      setShowFurigana: (show) => set({ showFurigana: show }),
      setShowTranslation: (show) => set({ showTranslation: show }),

      resetProgress: () =>
        set({
          xpToday: 0,
          xpTotal: 0,
          streak: 0,
          lastActiveDate: '',
          lessonsCompleted: [],
          skillLevels: {
            pronunciation: 0,
            vocabulary: 0,
            grammar: 0,
            culture: 0,
            listening: 0,
            speaking: 0,
          },
          humorIQ: 0,
          dojoSessions: 0,
        }),

      resetAll: () => set({ ...initialState }),
    }),
    {
      name: 'zlang-app-store',
    },
  ),
)

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

const translations: Record<string, { en: string; jp: string }> = {
  // ---- Landing page -------------------------------------------------------
  'landing.tagline': {
    en: 'Learn languages through content you actually love',
    jp: '好きなコンテンツで言語を学ぼう',
  },
  'landing.subtitle': {
    en: 'YouTube clips, AI tutoring, and real culture — not textbook drills',
    jp: 'YouTubeクリップ、AIチューター、リアルな文化 — 教科書のドリルではなく',
  },
  'landing.getStarted': {
    en: 'Get Started',
    jp: '始めましょう',
  },
  'landing.continueLesson': {
    en: 'Continue Learning',
    jp: '学習を続ける',
  },
  'landing.card.immersion.title': {
    en: 'Immersion Learning',
    jp: 'イマージョン学習',
  },
  'landing.card.immersion.subtitle': {
    en: 'Learn from real YouTube clips in context',
    jp: '本物のYouTubeクリップから文脈で学ぶ',
  },
  'landing.card.ai.title': {
    en: 'AI Tutor',
    jp: 'AIチューター',
  },
  'landing.card.ai.subtitle': {
    en: 'Claude explains grammar, culture, and nuance',
    jp: 'Claudeが文法、文化、ニュアンスを解説',
  },
  'landing.card.dojo.title': {
    en: 'Conversation Dojo',
    jp: '会話道場',
  },
  'landing.card.dojo.subtitle': {
    en: 'Practice real conversations with AI partners',
    jp: 'AIパートナーとリアルな会話を練習',
  },
  'landing.card.humor.title': {
    en: 'Humor Lab',
    jp: 'ユーモアラボ',
  },
  'landing.card.humor.subtitle': {
    en: 'Understand jokes and wordplay in your target language',
    jp: 'ターゲット言語のジョークや言葉遊びを理解する',
  },
  'landing.languageToggle': {
    en: 'English',
    jp: '日本語',
  },
  'landing.heroTitle': {
    en: 'Language Learning, Reimagined',
    jp: '言語学習を、再定義する',
  },
  'landing.heroDescription': {
    en: 'Master Japanese or English through immersive, AI-powered lessons built around content you love.',
    jp: '好きなコンテンツを使った没入型AI学習で、日本語や英語をマスターしよう。',
  },
  'landing.features': {
    en: 'Features',
    jp: '特徴',
  },
  'landing.howItWorks': {
    en: 'How It Works',
    jp: '使い方',
  },
  'landing.corridorA.title': {
    en: 'I speak English \u2014 Learning Japanese',
    jp: '英語話者 \u2014 日本語を学ぶ',
  },
  'landing.corridorA.subtitle': {
    en: 'Through anime, manga, and J-culture',
    jp: 'アニメ、マンガ、J-カルチャーを通じて',
  },
  'landing.corridorB.title': {
    en: '日本語を話す \u2014 Learning English',
    jp: '日本語を話す \u2014 英語を学ぶ',
  },
  'landing.corridorB.subtitle': {
    en: 'Through TikTok, NBA clips, and internet culture',
    jp: 'TikTok、NBAクリップ、インターネット文化を通じて',
  },
  'landing.appLanguage': {
    en: 'App language:',
    jp: 'アプリ言語:',
  },

  // ---- Dashboard ----------------------------------------------------------
  'dashboard.title': {
    en: 'Dashboard',
    jp: 'ダッシュボード',
  },
  'dashboard.welcome': {
    en: 'Welcome back!',
    jp: 'おかえりなさい！',
  },
  'dashboard.streak': {
    en: 'Streak',
    jp: 'ストリーク',
  },
  'dashboard.streakDays': {
    en: 'days',
    jp: '日',
  },
  'dashboard.todayXP': {
    en: 'Today\'s XP',
    jp: '今日のXP',
  },
  'dashboard.totalXP': {
    en: 'Total XP',
    jp: '合計XP',
  },
  'dashboard.lessonsCompleted': {
    en: 'Lessons Completed',
    jp: '完了したレッスン',
  },
  'dashboard.skills': {
    en: 'Skills',
    jp: 'スキル',
  },
  'dashboard.skill.pronunciation': {
    en: 'Pronunciation',
    jp: '発音',
  },
  'dashboard.skill.vocabulary': {
    en: 'Vocabulary',
    jp: '語彙',
  },
  'dashboard.skill.grammar': {
    en: 'Grammar',
    jp: '文法',
  },
  'dashboard.skill.culture': {
    en: 'Culture',
    jp: '文化',
  },
  'dashboard.skill.listening': {
    en: 'Listening',
    jp: 'リスニング',
  },
  'dashboard.skill.speaking': {
    en: 'Speaking',
    jp: 'スピーキング',
  },
  'dashboard.continueLesson': {
    en: 'Continue Lesson',
    jp: 'レッスンを続ける',
  },
  'dashboard.nextLesson': {
    en: 'Next Lesson',
    jp: '次のレッスン',
  },
  'dashboard.dailyGoal': {
    en: 'Daily Goal',
    jp: '毎日の目標',
  },
  'dashboard.dailyGoalProgress': {
    en: 'of your daily goal',
    jp: '毎日の目標の',
  },
  'dashboard.quickActions': {
    en: 'Quick Actions',
    jp: 'クイックアクション',
  },
  'dashboard.startDojo': {
    en: 'Start Dojo Session',
    jp: '道場セッションを開始',
  },
  'dashboard.openHumorLab': {
    en: 'Open Humor Lab',
    jp: 'ユーモアラボを開く',
  },
  'dashboard.reviewVocab': {
    en: 'Review Vocabulary',
    jp: '語彙を復習する',
  },
  'dashboard.dojoSessions': {
    en: 'Dojo Sessions',
    jp: '道場セッション',
  },
  'dashboard.humorIQ': {
    en: 'Humor IQ',
    jp: 'ユーモアIQ',
  },
  'dashboard.yourProgress': {
    en: 'Your Progress',
    jp: '学習の進捗',
  },
  'dashboard.thisWeek': {
    en: 'This Week',
    jp: '今週',
  },
  'dashboard.allTime': {
    en: 'All Time',
    jp: '通算',
  },
  'dashboard.noLessonsYet': {
    en: 'No lessons completed yet — start your first one!',
    jp: 'まだレッスンを完了していません — 最初のレッスンを始めましょう！',
  },
  'dashboard.dayStreak': {
    en: 'Day Streak',
    jp: '日連続',
  },
  'dashboard.encouragement': {
    en: 'Start learning today to build your streak!',
    jp: '今日から学習を始めてストリークを作ろう！',
  },
  'dashboard.xpGoalSubtitle': {
    en: '100 XP daily goal',
    jp: '毎日100XPが目標',
  },
  'dashboard.featuredClip': {
    en: 'Featured Clip',
    jp: '注目のクリップ',
  },
  'dashboard.startLesson': {
    en: 'Start Lesson',
    jp: 'レッスンを始める',
  },
  'dashboard.curriculumComplete': {
    en: "You've completed the curriculum!",
    jp: 'カリキュラムを全て完了しました！',
  },
  'dashboard.conversationDojo': {
    en: 'Conversation Dojo',
    jp: '会話道場',
  },
  'dashboard.humorLabTitle': {
    en: 'Humor Lab',
    jp: 'ユーモアラボ',
  },
  'dashboard.locked': {
    en: 'Locked',
    jp: 'ロック中',
  },
  'dashboard.yourSkills': {
    en: 'Your Skills',
    jp: 'あなたのスキル',
  },
  'dashboard.lessonProgress': {
    en: 'lessons completed',
    jp: 'レッスン完了',
  },
  'dashboard.unit': {
    en: 'Unit',
    jp: 'ユニット',
  },
  'dashboard.lesson': {
    en: 'Lesson',
    jp: 'レッスン',
  },
  'dashboard.min': {
    en: 'min',
    jp: '分',
  },

  // Streak messages
  'dashboard.streak.fire': {
    en: 'You\'re on fire!',
    jp: '絶好調！',
  },
  'dashboard.streak.keep': {
    en: 'Keep it going!',
    jp: 'この調子で！',
  },
  'dashboard.streak.start': {
    en: 'Start your streak today!',
    jp: '今日からストリークを始めよう！',
  },
  'dashboard.streak.amazing': {
    en: 'Amazing dedication!',
    jp: '素晴らしい継続力！',
  },
  'dashboard.streak.legend': {
    en: 'You\'re a legend!',
    jp: '伝説的！',
  },

  // ---- Lesson engine ------------------------------------------------------
  'lesson.phase.immersion': {
    en: 'Immersion',
    jp: 'イマージョン',
  },
  'lesson.phase.decode': {
    en: 'Decode',
    jp: 'デコード',
  },
  'lesson.phase.shadowing': {
    en: 'Shadowing',
    jp: 'シャドーイング',
  },
  'lesson.phase.response': {
    en: 'Response',
    jp: 'レスポンス',
  },
  'lesson.phase.culture': {
    en: 'Cultural Dive',
    jp: 'カルチャーダイブ',
  },
  'lesson.phase.review': {
    en: 'Review',
    jp: '復習',
  },
  'lesson.immersion.title': {
    en: 'Watch & Listen',
    jp: '見て、聴いて',
  },
  'lesson.immersion.instruction': {
    en: 'Watch the clip carefully. Focus on the sounds and rhythm.',
    jp: 'クリップをよく見てください。音やリズムに注目しましょう。',
  },
  'lesson.immersion.watchAgain': {
    en: 'Watch Again',
    jp: 'もう一度見る',
  },
  'lesson.immersion.showTranscript': {
    en: 'Show Transcript',
    jp: '字幕を表示',
  },
  'lesson.immersion.hideTranscript': {
    en: 'Hide Transcript',
    jp: '字幕を非表示',
  },
  'lesson.immersion.showTranslation': {
    en: 'Show Translation',
    jp: '翻訳を表示',
  },
  'lesson.immersion.hideTranslation': {
    en: 'Hide Translation',
    jp: '翻訳を非表示',
  },
  'lesson.immersion.ready': {
    en: 'I\'m ready to decode!',
    jp: 'デコードの準備ができました！',
  },

  'lesson.decode.title': {
    en: 'Decode the Language',
    jp: '言語をデコードする',
  },
  'lesson.decode.instruction': {
    en: 'Let\'s break down what you just heard. AI will analyze each line.',
    jp: '聞いた内容を分解しましょう。AIが各行を分析します。',
  },
  'lesson.decode.analyzing': {
    en: 'Analyzing the clip...',
    jp: 'クリップを分析中...',
  },
  'lesson.decode.grammarPoint': {
    en: 'Grammar Point',
    jp: '文法ポイント',
  },
  'lesson.decode.culturalNote': {
    en: 'Cultural Note',
    jp: '文化ノート',
  },
  'lesson.decode.literal': {
    en: 'Literal',
    jp: '直訳',
  },
  'lesson.decode.natural': {
    en: 'Natural',
    jp: '自然な訳',
  },
  'lesson.decode.vocab': {
    en: 'Vocabulary',
    jp: '語彙',
  },
  'lesson.decode.whyMatters': {
    en: 'Why This Matters',
    jp: 'なぜ重要か',
  },

  'lesson.shadowing.title': {
    en: 'Shadow the Speaker',
    jp: 'スピーカーをシャドウする',
  },
  'lesson.shadowing.instruction': {
    en: 'Listen and repeat. Try to match the pronunciation, rhythm, and tone.',
    jp: '聞いて繰り返してください。発音、リズム、トーンを合わせましょう。',
  },
  'lesson.shadowing.record': {
    en: 'Start Recording',
    jp: '録音開始',
  },
  'lesson.shadowing.stop': {
    en: 'Stop Recording',
    jp: '録音停止',
  },
  'lesson.shadowing.playback': {
    en: 'Play Back',
    jp: '再生',
  },
  'lesson.shadowing.tryAgain': {
    en: 'Try Again',
    jp: 'もう一度',
  },
  'lesson.shadowing.submit': {
    en: 'Submit for Grading',
    jp: '採点に提出',
  },
  'lesson.shadowing.stars': {
    en: 'Stars',
    jp: 'スター',
  },
  'lesson.shadowing.grading': {
    en: 'Grading your shadowing...',
    jp: 'シャドーイングを採点中...',
  },
  'lesson.shadowing.listenFirst': {
    en: 'Listen to the clip first, then shadow it',
    jp: 'まずクリップを聴いて、それからシャドーイングしましょう',
  },

  'lesson.response.title': {
    en: 'Your Response',
    jp: 'あなたのレスポンス',
  },
  'lesson.response.instruction': {
    en: 'Write a natural response to what you just heard. Use the language you\'re learning!',
    jp: '聞いた内容への自然な返答を書いてください。学習中の言語を使いましょう！',
  },
  'lesson.response.placeholder': {
    en: 'Type your response here...',
    jp: 'ここにレスポンスを入力...',
  },
  'lesson.response.submit': {
    en: 'Submit Response',
    jp: 'レスポンスを提出',
  },
  'lesson.response.grading': {
    en: 'Grading your response...',
    jp: 'レスポンスを採点中...',
  },
  'lesson.response.casualness': {
    en: 'Casualness',
    jp: 'カジュアルさ',
  },
  'lesson.response.culturalFit': {
    en: 'Cultural Fit',
    jp: '文化的適合度',
  },
  'lesson.response.naturalSlang': {
    en: 'Natural / Slang',
    jp: '自然さ/スラング',
  },
  'lesson.response.grammarScore': {
    en: 'Grammar',
    jp: '文法',
  },
  'lesson.response.improvedVersion': {
    en: 'Improved Version',
    jp: '改善版',
  },
  'lesson.response.oneThingToFix': {
    en: 'One Thing to Fix',
    jp: '改善ポイント',
  },

  'lesson.culture.title': {
    en: 'Cultural Deep Dive',
    jp: 'カルチャーディープダイブ',
  },
  'lesson.culture.instruction': {
    en: 'Let\'s explore the cultural context behind what you learned.',
    jp: '学んだことの文化的背景を探りましょう。',
  },
  'lesson.culture.loading': {
    en: 'Exploring cultural context...',
    jp: '文化的背景を探索中...',
  },

  'lesson.review.title': {
    en: 'Lesson Complete!',
    jp: 'レッスン完了！',
  },
  'lesson.review.xpEarned': {
    en: 'XP Earned',
    jp: '獲得XP',
  },
  'lesson.review.vocabLearned': {
    en: 'New Vocab',
    jp: '新しい語彙',
  },
  'lesson.review.grammarPoints': {
    en: 'Grammar Points',
    jp: '文法ポイント',
  },
  'lesson.review.backToDashboard': {
    en: 'Back to Dashboard',
    jp: 'ダッシュボードに戻る',
  },
  'lesson.review.nextLesson': {
    en: 'Next Lesson',
    jp: '次のレッスン',
  },
  'lesson.review.perfectLesson': {
    en: 'Perfect Lesson!',
    jp: 'パーフェクトレッスン！',
  },
  'lesson.review.greatJob': {
    en: 'Great job!',
    jp: 'よくできました！',
  },

  'lesson.nav.phase': {
    en: 'Phase',
    jp: 'フェーズ',
  },
  'lesson.nav.skip': {
    en: 'Skip',
    jp: 'スキップ',
  },
  'lesson.nav.continue': {
    en: 'Continue',
    jp: '次へ進む',
  },
  'lesson.nav.exit': {
    en: 'Exit Lesson',
    jp: 'レッスンを終了',
  },
  'lesson.nav.exitConfirm': {
    en: 'Are you sure? Your progress in this lesson won\'t be saved.',
    jp: '本当に終了しますか？このレッスンの進捗は保存されません。',
  },

  // ---- Comprehension questions --------------------------------------------
  'lesson.comprehension.title': {
    en: 'Comprehension Check',
    jp: '理解度チェック',
  },
  'lesson.comprehension.instruction': {
    en: 'Answer these questions about the clip.',
    jp: 'クリップについての質問に答えてください。',
  },
  'lesson.comprehension.correct': {
    en: 'Correct!',
    jp: '正解！',
  },
  'lesson.comprehension.incorrect': {
    en: 'Not quite — try again!',
    jp: 'ちょっと違います — もう一度！',
  },
  'lesson.comprehension.generating': {
    en: 'Generating questions...',
    jp: '質問を生成中...',
  },

  // ---- Dojo ---------------------------------------------------------------
  'dojo.title': {
    en: 'Conversation Dojo',
    jp: '会話道場',
  },
  'dojo.subtitle': {
    en: 'Practice real conversations with your AI partner',
    jp: 'AIパートナーとリアルな会話を練習しよう',
  },
  'dojo.chooseScenario': {
    en: 'Choose a Scenario',
    jp: 'シナリオを選択',
  },
  'dojo.scenario.combini': {
    en: 'Convenience Store',
    jp: 'コンビニ',
  },
  'dojo.scenario.combiniDesc': {
    en: 'Buy snacks and ask for help at a Japanese convenience store',
    jp: '日本のコンビニでお菓子を買って、助けを求める',
  },
  'dojo.scenario.izakaya': {
    en: 'Izakaya Night',
    jp: '居酒屋の夜',
  },
  'dojo.scenario.izakayaDesc': {
    en: 'Order food and drinks at a casual Japanese pub',
    jp: 'カジュアルな日本の居酒屋で料理やドリンクを注文',
  },
  'dojo.scenario.train': {
    en: 'Lost on the Train',
    jp: '電車で迷子',
  },
  'dojo.scenario.trainDesc': {
    en: 'Ask for directions on the Tokyo subway system',
    jp: '東京の地下鉄で道を聞く',
  },
  'dojo.scenario.meetup': {
    en: 'Friend Meetup',
    jp: '友達との待ち合わせ',
  },
  'dojo.scenario.meetupDesc': {
    en: 'Casual chat meeting a friend at a cafe',
    jp: 'カフェで友達とカジュアルにおしゃべり',
  },
  'dojo.scenario.shrine': {
    en: 'Temple Visit',
    jp: 'お寺参り',
  },
  'dojo.scenario.shrineDesc': {
    en: 'Ask about history and customs at a Japanese temple',
    jp: '日本のお寺で歴史や風習について聞く',
  },
  'dojo.scenario.shopping': {
    en: 'Shopping in Harajuku',
    jp: '原宿でショッピング',
  },
  'dojo.scenario.shoppingDesc': {
    en: 'Browse clothes and negotiate in trendy shops',
    jp: 'トレンディなショップで服を見たり交渉する',
  },
  'dojo.scenario.office': {
    en: 'Office Introduction',
    jp: 'オフィスでの自己紹介',
  },
  'dojo.scenario.officeDesc': {
    en: 'Introduce yourself on your first day at a Japanese company',
    jp: '日本の会社での初日に自己紹介する',
  },
  'dojo.scenario.doctor': {
    en: 'At the Doctor',
    jp: '病院で',
  },
  'dojo.scenario.doctorDesc': {
    en: 'Describe symptoms and understand medical advice',
    jp: '症状を説明し、医療アドバイスを理解する',
  },
  'dojo.inputPlaceholder': {
    en: 'Type your message...',
    jp: 'メッセージを入力...',
  },
  'dojo.send': {
    en: 'Send',
    jp: '送信',
  },
  'dojo.thinking': {
    en: 'Thinking...',
    jp: '考え中...',
  },
  'dojo.endSession': {
    en: 'End Session',
    jp: 'セッションを終了',
  },
  'dojo.sessionSummary': {
    en: 'Session Summary',
    jp: 'セッションの要約',
  },
  'dojo.messagesExchanged': {
    en: 'Messages Exchanged',
    jp: 'メッセージ交換数',
  },
  'dojo.newScenario': {
    en: 'Try Another Scenario',
    jp: '別のシナリオを試す',
  },
  'dojo.hint': {
    en: 'Need a hint?',
    jp: 'ヒントが必要？',
  },
  'dojo.showHint': {
    en: 'Show Hint',
    jp: 'ヒントを表示',
  },
  'dojo.correction': {
    en: 'Correction',
    jp: '修正',
  },

  // ---- Humor Lab ----------------------------------------------------------
  'humor.title': {
    en: 'Humor Lab',
    jp: 'ユーモアラボ',
  },
  'humor.subtitle': {
    en: 'Decode jokes, puns, and wordplay in your target language',
    jp: 'ターゲット言語のジョーク、ダジャレ、言葉遊びを解読',
  },
  'humor.instruction': {
    en: 'Watch the clip, then see if you can explain the humor!',
    jp: 'クリップを見て、ユーモアを説明できるか試しましょう！',
  },
  'humor.explain': {
    en: 'Explain the Humor',
    jp: 'ユーモアを説明する',
  },
  'humor.analyzing': {
    en: 'Analyzing the humor...',
    jp: 'ユーモアを分析中...',
  },
  'humor.rating.gotIt': {
    en: 'Got it!',
    jp: '分かった！',
  },
  'humor.rating.kindaFunny': {
    en: 'Kinda funny',
    jp: 'ちょっと面白い',
  },
  'humor.rating.confused': {
    en: 'Still confused',
    jp: 'まだ分からない',
  },
  'humor.iq': {
    en: 'Humor IQ',
    jp: 'ユーモアIQ',
  },
  'humor.iqGained': {
    en: 'Humor IQ gained!',
    jp: 'ユーモアIQを獲得！',
  },
  'humor.type.pun': {
    en: 'Pun / Wordplay',
    jp: 'ダジャレ / 言葉遊び',
  },
  'humor.type.cultural': {
    en: 'Cultural Humor',
    jp: '文化的ユーモア',
  },
  'humor.type.slapstick': {
    en: 'Physical / Slapstick',
    jp: 'フィジカル / スラップスティック',
  },
  'humor.type.sarcasm': {
    en: 'Sarcasm / Irony',
    jp: '皮肉 / アイロニー',
  },
  'humor.type.deadpan': {
    en: 'Deadpan',
    jp: '真顔ギャグ',
  },
  'humor.type.manzai': {
    en: 'Manzai (Comedy Duo)',
    jp: '漫才',
  },
  'humor.nextClip': {
    en: 'Next Clip',
    jp: '次のクリップ',
  },
  'humor.explainMore': {
    en: 'Explain More',
    jp: 'もっと説明して',
  },

  // ---- Settings -----------------------------------------------------------
  'settings.title': {
    en: 'Settings',
    jp: '設定',
  },
  'settings.profile': {
    en: 'Profile',
    jp: 'プロフィール',
  },
  'settings.corridor': {
    en: 'Learning Corridor',
    jp: '学習コリドー',
  },
  'settings.uiLanguage': {
    en: 'UI Language',
    jp: 'UI言語',
  },
  'settings.level': {
    en: 'Current Level',
    jp: '現在のレベル',
  },
  'settings.notifications': {
    en: 'Notifications',
    jp: '通知',
  },
  'settings.reminders': {
    en: 'Daily Reminders',
    jp: 'デイリーリマインダー',
  },
  'settings.reminderTime': {
    en: 'Reminder Time',
    jp: 'リマインダーの時間',
  },
  'settings.data': {
    en: 'Data',
    jp: 'データ',
  },
  'settings.resetProgress': {
    en: 'Reset Progress',
    jp: '進捗をリセット',
  },
  'settings.resetAll': {
    en: 'Reset Everything',
    jp: 'すべてリセット',
  },
  'settings.resetConfirm': {
    en: 'Are you sure? This cannot be undone.',
    jp: '本当ですか？元に戻すことはできません。',
  },
  'settings.export': {
    en: 'Export Data',
    jp: 'データをエクスポート',
  },
  'settings.import': {
    en: 'Import Data',
    jp: 'データをインポート',
  },
  'settings.appearance': {
    en: 'Appearance',
    jp: '外観',
  },
  'settings.theme': {
    en: 'Theme',
    jp: 'テーマ',
  },
  'settings.themeLight': {
    en: 'Light',
    jp: 'ライト',
  },
  'settings.themeDark': {
    en: 'Dark',
    jp: 'ダーク',
  },
  'settings.themeSystem': {
    en: 'System',
    jp: 'システム',
  },
  'settings.about': {
    en: 'About Zlang',
    jp: 'Zlangについて',
  },
  'settings.version': {
    en: 'Version',
    jp: 'バージョン',
  },
  'settings.save': {
    en: 'Save Changes',
    jp: '変更を保存',
  },
  'settings.saved': {
    en: 'Changes saved!',
    jp: '変更を保存しました！',
  },

  // ---- Navigation ---------------------------------------------------------
  'nav.home': {
    en: 'Home',
    jp: 'ホーム',
  },
  'nav.dashboard': {
    en: 'Dashboard',
    jp: 'ダッシュボード',
  },
  'nav.lessons': {
    en: 'Lessons',
    jp: 'レッスン',
  },
  'nav.share': {
    en: 'Share',
    jp: 'シェア',
  },
  'nav.studio': {
    en: 'Studio',
    jp: 'スタジオ',
  },
  'nav.dojo': {
    en: 'Dojo',
    jp: '道場',
  },
  'nav.humorLab': {
    en: 'Humor Lab',
    jp: 'ユーモアラボ',
  },
  'nav.settings': {
    en: 'Settings',
    jp: '設定',
  },
  'nav.profile': {
    en: 'Profile',
    jp: 'プロフィール',
  },
  'nav.vocab': {
    en: 'Vocabulary',
    jp: '語彙',
  },
  'nav.progress': {
    en: 'Progress',
    jp: '進捗',
  },

  // ---- Common -------------------------------------------------------------
  'common.loading': {
    en: 'Loading...',
    jp: '読み込み中...',
  },
  'common.error': {
    en: 'Something went wrong',
    jp: 'エラーが発生しました',
  },
  'common.errorTryAgain': {
    en: 'Something went wrong. Please try again.',
    jp: 'エラーが発生しました。もう一度お試しください。',
  },
  'common.continue': {
    en: 'Continue',
    jp: '続ける',
  },
  'common.back': {
    en: 'Back',
    jp: '戻る',
  },
  'common.next': {
    en: 'Next',
    jp: '次へ',
  },
  'common.cancel': {
    en: 'Cancel',
    jp: 'キャンセル',
  },
  'common.confirm': {
    en: 'Confirm',
    jp: '確認',
  },
  'common.save': {
    en: 'Save',
    jp: '保存',
  },
  'common.delete': {
    en: 'Delete',
    jp: '削除',
  },
  'common.edit': {
    en: 'Edit',
    jp: '編集',
  },
  'common.close': {
    en: 'Close',
    jp: '閉じる',
  },
  'common.done': {
    en: 'Done',
    jp: '完了',
  },
  'common.yes': {
    en: 'Yes',
    jp: 'はい',
  },
  'common.no': {
    en: 'No',
    jp: 'いいえ',
  },
  'common.ok': {
    en: 'OK',
    jp: 'OK',
  },
  'common.retry': {
    en: 'Retry',
    jp: 'もう一度',
  },
  'common.skip': {
    en: 'Skip',
    jp: 'スキップ',
  },
  'common.submit': {
    en: 'Submit',
    jp: '提出',
  },
  'common.search': {
    en: 'Search',
    jp: '検索',
  },
  'common.noResults': {
    en: 'No results found',
    jp: '結果が見つかりません',
  },
  'common.minutesShort': {
    en: 'min',
    jp: '分',
  },
  'common.hoursShort': {
    en: 'hr',
    jp: '時間',
  },
  'common.xp': {
    en: 'XP',
    jp: 'XP',
  },
  'common.level': {
    en: 'Level',
    jp: 'レベル',
  },
  'common.or': {
    en: 'or',
    jp: 'または',
  },
  'common.and': {
    en: 'and',
    jp: 'と',
  },
  'common.welcome': {
    en: 'Welcome',
    jp: 'ようこそ',
  },
  'common.congratulations': {
    en: 'Congratulations!',
    jp: 'おめでとうございます！',
  },
  'common.perfect': {
    en: 'Perfect!',
    jp: 'パーフェクト！',
  },
  'common.great': {
    en: 'Great!',
    jp: 'すごい！',
  },
  'common.good': {
    en: 'Good',
    jp: '良い',
  },
  'common.tryAgain': {
    en: 'Try Again',
    jp: 'もう一度やる',
  },
  'common.notBad': {
    en: 'Not bad!',
    jp: '悪くない！',
  },
  'common.keepGoing': {
    en: 'Keep going!',
    jp: '頑張って！',
  },
  'common.almostThere': {
    en: 'Almost there!',
    jp: 'もう少し！',
  },
  'common.offline': {
    en: 'You\'re offline',
    jp: 'オフラインです',
  },
  'common.online': {
    en: 'Back online',
    jp: 'オンラインに復帰',
  },
  'common.version': {
    en: 'Version',
    jp: 'バージョン',
  },
  'common.poweredBy': {
    en: 'Powered by Claude AI',
    jp: 'Claude AIで動作',
  },

  // ---- Vocab review -------------------------------------------------------
  'vocab.title': {
    en: 'Vocabulary Review',
    jp: '語彙復習',
  },
  'vocab.dueToday': {
    en: 'Due Today',
    jp: '今日の復習',
  },
  'vocab.noDue': {
    en: 'No vocabulary due for review!',
    jp: '復習する語彙はありません！',
  },
  'vocab.confidence.1': {
    en: 'Hard — review tomorrow',
    jp: '難しい — 明日復習',
  },
  'vocab.confidence.2': {
    en: 'OK — review in 3 days',
    jp: 'まあまあ — 3日後に復習',
  },
  'vocab.confidence.3': {
    en: 'Easy — review in a week',
    jp: '簡単 — 1週間後に復習',
  },
  'vocab.meaning': {
    en: 'Meaning',
    jp: '意味',
  },
  'vocab.example': {
    en: 'Example',
    jp: '例文',
  },
  'vocab.reading': {
    en: 'Reading',
    jp: '読み方',
  },
  'vocab.showAnswer': {
    en: 'Show Answer',
    jp: '答えを表示',
  },
  'vocab.totalLearned': {
    en: 'Total Learned',
    jp: '合計学習済み',
  },
  'vocab.mastered': {
    en: 'Mastered',
    jp: 'マスター済み',
  },

  // ---- Onboarding / first time --------------------------------------------
  'onboarding.welcome': {
    en: 'Welcome to Zlang!',
    jp: 'Zlangへようこそ！',
  },
  'onboarding.description': {
    en: 'Let\'s set up your personalized learning experience.',
    jp: 'あなたに合わせた学習体験を設定しましょう。',
  },
  'onboarding.letsGo': {
    en: 'Let\'s Go!',
    jp: 'さぁ始めよう！',
  },

  // ---- Errors / empty states ----------------------------------------------
  'error.notFound': {
    en: 'Page not found',
    jp: 'ページが見つかりません',
  },
  'error.lessonNotFound': {
    en: 'Lesson not found',
    jp: 'レッスンが見つかりません',
  },
  'error.clipNotFound': {
    en: 'Clip not found',
    jp: 'クリップが見つかりません',
  },
  'error.apiError': {
    en: 'AI service error — please try again',
    jp: 'AIサービスエラー — もう一度お試しください',
  },
  'error.networkError': {
    en: 'Network error — check your connection',
    jp: 'ネットワークエラー — 接続を確認してください',
  },
  'error.micPermission': {
    en: 'Microphone permission required for shadowing',
    jp: 'シャドーイングにはマイクの許可が必要です',
  },
  'error.noMicFound': {
    en: 'No microphone found',
    jp: 'マイクが見つかりません',
  },
  'error.youtubeLoadFailed': {
    en: 'Failed to load YouTube player',
    jp: 'YouTubeプレーヤーの読み込みに失敗しました',
  },
  'error.goHome': {
    en: 'Go Home',
    jp: 'ホームに戻る',
  },

  // ---- Units / lesson list ------------------------------------------------
  'units.title': {
    en: 'Lessons',
    jp: 'レッスン',
  },
  'units.unit': {
    en: 'Unit',
    jp: 'ユニット',
  },
  'units.lesson': {
    en: 'Lesson',
    jp: 'レッスン',
  },
  'units.locked': {
    en: 'Locked',
    jp: 'ロック中',
  },
  'units.completed': {
    en: 'Completed',
    jp: '完了',
  },
  'units.inProgress': {
    en: 'In Progress',
    jp: '進行中',
  },
  'units.start': {
    en: 'Start Lesson',
    jp: 'レッスンを開始',
  },
  'units.estimatedTime': {
    en: 'Estimated time',
    jp: '推定時間',
  },
  'units.skills': {
    en: 'Skills covered',
    jp: '対象スキル',
  },
}

// ---------------------------------------------------------------------------
// Translation helper
// ---------------------------------------------------------------------------

export function t(key: string, language: 'en' | 'jp'): string {
  const entry = translations[key]
  if (!entry) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[t] Missing translation key: "${key}"`)
    }
    return key
  }
  return entry[language]
}
