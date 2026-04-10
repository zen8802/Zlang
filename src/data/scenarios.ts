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
    name: string
    nameJP: string
    description: string
    personality: string
    speechStyle: string
    relationship: string
    voiceId: string
    avatar: string       // path in /public e.g. '/characters/takeshi.png'
  }
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
    description: 'Order your perfect bowl at a bustling neighborhood ramen joint. Handle toppings, spice level, and the ticket machine.',
    emoji: '🍜',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    tags: ['ordering', 'food vocab', 'counters', 'polite speech'],
    character: {
      name: 'Takeshi',
      nameJP: 'たけし',
      description: 'A gruff but friendly ramen chef in his 50s who takes great pride in his tonkotsu broth.',
      personality: 'Warm, a bit loud, proud of his craft. Speaks in short, punchy sentences.',
      speechStyle: 'Casual masculine Japanese. Uses だ/だよ endings, omits particles sometimes. Throws in おう and よし.',
      relationship: 'Shop owner to customer',
      voiceId: 'JOcmGzB8OFjY8MhjHHEf',
      avatar: '/Takeshi1.png',
    },
    conversationFlow: [
      'Welcome the learner into the shop and seat them at the counter.',
      'Ask how firm they want their noodles (麺(めん)の硬(かた)さ) and take that order.',
      'Respond when the learner asks for a glass of water (お水(みず)) and bring it.',
      'Tell them the total and take their payment, then wrap up the visit.',
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
  {
    id: 'convenience-store',
    category: 'Food & Drink',
    categoryEmoji: '🍜',
    title: 'Convenience Store',
    titleJP: 'コンビニ',
    description: 'Navigate a konbini run — ask about bento, use the microwave, and pay. Deceptively tricky!',
    emoji: '🏪',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    tags: ['shopping', 'numbers', 'polite phrases', 'daily life'],
    character: {
      name: 'Yuki',
      nameJP: 'ゆき',
      description: 'A cheerful college student working the night shift at a convenience store.',
      personality: 'Energetic, helpful, speaks fast but clearly. Always smiling.',
      speechStyle: 'Polite service Japanese (接客用語). Uses いらっしゃいませ, ～でございます, ポイントカード patterns.',
      relationship: 'Cashier to customer',
      voiceId: 'EkK6wL8GaH8IgBZTTDGJ',
      avatar: '/Yuki1.png',
    },
    setting: 'A brightly lit 7-Eleven at 10pm. Shelves of onigiri, bento, and drinks. The microwave hums.',
    settingJP: '夜10時の明るいセブンイレブン。おにぎり、弁当、飲み物の棚。電子レンジの音が聞こえる。',
    userGoal: 'Buy a bento, get it heated up, and complete the payment including point card questions.',
    openingLine: 'いらっしゃいませ！温かいお弁当もありますよ。何かお探しですか？',
    openingLineEN: 'Welcome! We have warm bento boxes too. Are you looking for something?',
    culturalNotes: [
      'Cashiers will ask お弁当温めますか？ (Shall I heat your bento?)',
      'They\'ll ask about chopsticks (お箸), bags (袋), and point cards (ポイントカード).',
      'Saying 大丈夫です can mean "No thanks" in this context.',
      'Paying with IC card: the cashier says the total and you tap your card.',
    ],
    tweaks: [
      {
        id: 'payment',
        label: 'Payment method',
        type: 'select',
        options: ['Cash', 'IC Card (Suica/Pasmo)', 'Credit card'],
        defaultValue: 'Cash',
        promptInjection: 'The user is paying with {value}. Adjust the cashier dialogue accordingly.',
      },
      {
        id: 'point-card',
        label: 'Has a point card',
        type: 'toggle',
        defaultValue: false,
        promptInjection: 'If the user has a point card, the cashier should ask for it. If not, the user needs to decline politely.',
      },
    ],
    color: '#00A650',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'izakaya',
    category: 'Food & Drink',
    categoryEmoji: '🍜',
    title: 'Izakaya Night',
    titleJP: '居酒屋の夜',
    description: 'Order rounds of drinks and shared plates at a lively izakaya with coworkers.',
    emoji: '🍶',
    difficulty: 'intermediate',
    estimatedMinutes: 8,
    tags: ['drinking culture', 'group ordering', 'casual speech', 'toasts'],
    character: {
      name: 'Kenji',
      nameJP: 'けんじ',
      description: 'Your friendly coworker in his 30s who organized this after-work drinking session.',
      personality: 'Outgoing, loves food, gets excited about menu items. The group organizer type.',
      speechStyle: 'Casual-polite mix. Uses ～しない？ for suggestions, たら for conditionals. Throws in English loanwords.',
      relationship: 'Coworker and friend',
      voiceId: '8BU0fsFBiPt1cbGZ5lK9',
      avatar: '/Kenji1.png',
    },
    setting: 'A warm, wood-paneled izakaya near the office. Red lanterns outside, handwritten menu on the wall, the sound of clinking glasses.',
    settingJP: '会社の近くの温かい木造の居酒屋。外に赤提灯、壁に手書きメニュー、グラスの音が響く。',
    userGoal: 'Navigate ordering drinks, sharing dishes, making toasts, and handling the bill-splitting conversation.',
    openingLine: 'お疲れ～！やっと金曜日だね。とりあえず生ビールでいい？それとも何か別のにする？',
    openingLineEN: 'Good work today! Finally Friday, right? Shall we start with draft beer? Or do you want something else?',
    culturalNotes: [
      'とりあえずビール (beer first!) is the classic izakaya opening move.',
      '乾杯 (kanpai) — always wait for the group toast before drinking.',
      'Pouring drinks for others (お酌) shows politeness. Never pour your own.',
      '割り勘 (warikan) means splitting the bill equally, which is the norm among coworkers.',
    ],
    tweaks: [
      {
        id: 'group-size',
        label: 'Group size',
        type: 'select',
        options: ['Just the two of you', 'Small group (4 people)', 'Big party (8+ people)'],
        defaultValue: 'Small group (4 people)',
        promptInjection: 'The group size is {value}. Adjust ordering dynamics and conversation accordingly.',
      },
      {
        id: 'boss-present',
        label: 'Your boss is there',
        type: 'toggle',
        defaultValue: false,
        promptInjection: 'If the boss is present, Kenji will use more polite language and the user should practice respectful speech. Add keigo practice opportunities.',
      },
      {
        id: 'nomihoudai',
        label: 'All-you-can-drink (飲み放題)',
        type: 'toggle',
        defaultValue: false,
        promptInjection: 'If enabled, the group has ordered 飲み放題 (all-you-can-drink). The character should mention the time limit and ordering process.',
      },
    ],
    color: '#8B4513',
    gradient: 'from-amber-700 to-orange-600',
  },

  // ── Daily Life ────────────────────────────────────────────────────────
  {
    id: 'lost-directions',
    category: 'Daily Life',
    categoryEmoji: '🏠',
    title: 'Lost in Town',
    titleJP: '道に迷った',
    description: 'You\'re lost near a train station. Ask a passerby for directions to your destination.',
    emoji: '🗺️',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    tags: ['directions', 'polite requests', 'location words', 'すみません'],
    character: {
      name: 'Mika',
      nameJP: 'みか',
      description: 'A kind elderly woman carrying groceries who knows the neighborhood like the back of her hand.',
      personality: 'Patient, warm, speaks slowly and clearly. Happy to help foreigners.',
      speechStyle: 'Polite feminine Japanese. Uses ～ですよ, ～ましょうか, のよ. Speaks at a gentle pace.',
      relationship: 'Helpful stranger',
      voiceId: 'RWZ1lnBIIgPBTpyCnKn2',
      avatar: '/characters/mika.png',
    },
    setting: 'A quiet residential street near Shimokitazawa station. Small shops, narrow lanes, a few bicycles parked along the road.',
    settingJP: '下北沢駅近くの静かな住宅街。小さな店、狭い路地、道に沿って並ぶ自転車。',
    userGoal: 'Get clear directions to your destination and understand landmarks along the way.',
    openingLine: 'あら、大丈夫ですか？道に迷いましたか？どこに行きたいんですか？',
    openingLineEN: 'Oh, are you alright? Are you lost? Where are you trying to go?',
    culturalNotes: [
      'すみません is the go-to word for getting a stranger\'s attention politely.',
      'Japanese directions often reference landmarks (コンビニの角を右 — turn right at the convenience store corner).',
      'People may walk you partway to your destination — this is common kindness.',
      'Bowing slightly when thanking someone for help is appreciated.',
    ],
    tweaks: [
      {
        id: 'destination',
        label: 'Where are you going?',
        type: 'select',
        options: ['A famous shrine', 'A specific restaurant', 'Your hotel', 'The nearest station'],
        defaultValue: 'The nearest station',
        promptInjection: 'The user is trying to find {value}. Give directions appropriate to this destination with relevant landmarks.',
      },
      {
        id: 'has-map',
        label: 'You have a map/phone to show',
        type: 'toggle',
        defaultValue: true,
        promptInjection: 'If the user has a map, the character can point at it and reference it. If not, directions must be purely verbal.',
      },
    ],
    color: '#4A90D9',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    id: 'doctor-visit',
    category: 'Daily Life',
    categoryEmoji: '🏠',
    title: 'Doctor Visit',
    titleJP: '病院に行く',
    description: 'Describe your symptoms at a Japanese clinic. Fill out forms and understand the doctor\'s advice.',
    emoji: '🏥',
    difficulty: 'intermediate',
    estimatedMinutes: 8,
    tags: ['medical vocab', 'body parts', 'symptoms', 'formal speech'],
    character: {
      name: 'Dr. Suzuki',
      nameJP: '鈴木先生',
      description: 'A calm, thorough doctor at a small neighborhood clinic. Experienced with foreign patients.',
      personality: 'Professional, patient, explains things clearly. Occasionally checks understanding.',
      speechStyle: 'Formal polite Japanese. Uses medical terms but explains them. ～てください for instructions, ～ましょう for suggestions.',
      relationship: 'Doctor to patient',
      voiceId: 'SOuiRq8aXqyALuq5QIQ8',
      avatar: '/characters/suzuki.png',
    },
    setting: 'A small, clean clinic in a residential area. White walls, a desk with a computer, an examination bed behind a curtain.',
    settingJP: '住宅地の小さくて清潔なクリニック。白い壁、パソコンのある机、カーテンの奥に診察台。',
    userGoal: 'Describe your symptoms clearly, understand the diagnosis, and follow instructions for treatment.',
    openingLine: '鈴木です。今日はどうされましたか？どこか具合が悪いですか？',
    openingLineEN: 'I\'m Dr. Suzuki. What brings you in today? Are you feeling unwell somewhere?',
    culturalNotes: [
      'Japanese clinics (クリニック) are smaller and more common than hospitals (病院).',
      'You\'ll need your health insurance card (保険証) at reception.',
      'Doctors in Japan tend to prescribe medicine readily — you\'ll pick it up at a separate pharmacy (薬局).',
      'The reception form (問診票) asks basic medical history questions.',
    ],
    tweaks: [
      {
        id: 'symptom',
        label: 'Your main symptom',
        type: 'select',
        options: ['Cold / sore throat', 'Stomach pain', 'Headache / fever', 'Injury / sprain'],
        defaultValue: 'Cold / sore throat',
        promptInjection: 'The user\'s main symptom is {value}. The doctor should ask follow-up questions and give advice specific to this condition.',
      },
      {
        id: 'insurance',
        label: 'Have health insurance',
        type: 'toggle',
        defaultValue: true,
        promptInjection: 'If the user has insurance, normal clinic flow. If not, the reception may mention costs and the user should practice asking about payment.',
      },
    ],
    color: '#E74C3C',
    gradient: 'from-red-400 to-red-600',
  },

  // ── Social ────────────────────────────────────────────────────────────
  {
    id: 'making-friends',
    category: 'Social',
    categoryEmoji: '👥',
    title: 'Making Friends',
    titleJP: '友達を作る',
    description: 'Strike up a conversation at a language exchange meetup. Introduce yourself and find common interests.',
    emoji: '🤝',
    difficulty: 'beginner',
    estimatedMinutes: 6,
    tags: ['self-intro', 'hobbies', 'questions', 'casual polite'],
    character: {
      name: 'Yuki',
      nameJP: 'ゆき',
      description: 'A university student studying English who is curious about your culture and eager to chat.',
      personality: 'Curious, enthusiastic, giggly. Asks lots of follow-up questions. Mixes in some English words.',
      speechStyle: 'Young casual-polite Japanese. Uses ～んですか for curious questions, ～だよね for agreement. Some slang.',
      relationship: 'New acquaintance at language exchange',
      voiceId: 'EkK6wL8GaH8IgBZTTDGJ',
      avatar: '/Yuki1.png',
    },
    setting: 'A cozy cafe hosting a language exchange event. Mismatched chairs, good coffee, a mix of Japanese and international attendees.',
    settingJP: 'ランゲージエクスチェンジイベントのある居心地のいいカフェ。バラバラの椅子、美味しいコーヒー、日本人と外国人が混ざっている。',
    userGoal: 'Introduce yourself, ask about hobbies and interests, and make plans to hang out again.',
    openingLine: 'あ、こんにちは！初めてですか、このイベント？私ははなです。よろしくね！どこから来たんですか？',
    openingLineEN: 'Oh, hi! Is this your first time at this event? I\'m Hana. Nice to meet you! Where are you from?',
    culturalNotes: [
      '自己紹介 (jikoshoukai) — self-introductions are a big deal in Japan. Name, origin, and one interesting fact.',
      'よろしくお願いします is essential when meeting someone for the first time.',
      'Japanese people often ask about hobbies (趣味) early in conversation.',
      'Exchanging LINE IDs (not phone numbers) is how people stay in touch.',
    ],
    tweaks: [
      {
        id: 'your-interests',
        label: 'Your main interest',
        type: 'select',
        options: ['Anime & manga', 'Music (J-pop, bands)', 'Food & cooking', 'Travel & nature', 'Gaming'],
        defaultValue: 'Anime & manga',
        promptInjection: 'The user\'s main interest is {value}. Hana should find common ground and get excited about this topic.',
      },
      {
        id: 'language-mix',
        label: 'Hana mixes in English',
        type: 'toggle',
        defaultValue: true,
        promptInjection: 'If enabled, Hana occasionally uses English words or phrases (realistic language exchange behavior). If disabled, she speaks only Japanese.',
      },
    ],
    color: '#FF69B4',
    gradient: 'from-pink-400 to-pink-600',
  },
  {
    id: 'job-interview',
    category: 'Social',
    categoryEmoji: '👥',
    title: 'Job Interview',
    titleJP: '面接',
    description: 'Survive a formal Japanese job interview. Practice keigo, self-PR, and answering tough questions.',
    emoji: '💼',
    difficulty: 'advanced',
    estimatedMinutes: 12,
    tags: ['keigo', 'business Japanese', 'self-PR', 'formal'],
    character: {
      name: 'Mr. Suzuki',
      nameJP: '鈴木部長',
      description: 'A stern but fair department manager conducting the second-round interview at a mid-size IT company.',
      personality: 'Serious, observant, values politeness and preparation. Occasionally smiles when impressed.',
      speechStyle: 'Formal business Japanese. Uses ～でございます, ～いただけますか. Asks open-ended questions. No casual speech.',
      relationship: 'Interviewer (senior manager)',
      voiceId: 'SOuiRq8aXqyALuq5QIQ8',
      avatar: '/characters/suzuki.png',
    },
    setting: 'A meeting room on the 12th floor of an office building in Shinagawa. A long table, water glasses, and a company brochure.',
    settingJP: '品川のオフィスビル12階の会議室。長いテーブル、水のグラス、会社のパンフレット。',
    userGoal: 'Make a strong impression using proper keigo, answer questions about your background, and ask thoughtful questions.',
    openingLine: '本日はお忙しい中、お越しいただきありがとうございます。山本と申します。まず、簡単に自己紹介をお願いできますか。',
    openingLineEN: 'Thank you for coming despite your busy schedule today. I\'m Yamamoto. First, could you please give a brief self-introduction?',
    culturalNotes: [
      'Japanese interviews start with 自己紹介 (self-intro) and 自己PR (self-promotion).',
      'Keigo (敬語) is absolutely required. Mixing up 尊敬語 and 謙譲語 is a red flag.',
      'Always bring copies of your 履歴書 (resume) and enter with a knock and お願いします.',
      'Ending the interview by thanking for their time: 本日はお時間をいただきありがとうございました.',
    ],
    tweaks: [
      {
        id: 'job-type',
        label: 'Position type',
        type: 'select',
        options: ['Software Engineer', 'Marketing', 'Teaching / ALT', 'General office work'],
        defaultValue: 'Software Engineer',
        promptInjection: 'The position is {value}. Tailor interview questions and expectations to this role.',
      },
      {
        id: 'strictness',
        label: 'Interviewer strictness',
        type: 'select',
        options: ['Friendly & encouraging', 'Standard formal', 'Tough & probing'],
        defaultValue: 'Standard formal',
        promptInjection: 'The interviewer\'s style is {value}. Adjust difficulty of follow-up questions and reactions accordingly.',
      },
    ],
    color: '#2C3E50',
    gradient: 'from-gray-700 to-gray-900',
  },
  {
    id: 'date',
    category: 'Social',
    categoryEmoji: '👥',
    title: 'First Date',
    titleJP: '初デート',
    description: 'Navigate a casual first date at a trendy cafe. Practice small talk, compliments, and making plans.',
    emoji: '💕',
    difficulty: 'intermediate',
    estimatedMinutes: 8,
    tags: ['casual speech', 'compliments', 'opinions', 'making plans'],
    character: {
      name: 'Mika',
      nameJP: 'みか',
      description: 'A 20-something graphic designer you matched with on a dating app. Creative, witty, a little shy at first.',
      personality: 'Artsy, thoughtful, warms up over the conversation. Has a dry sense of humor.',
      speechStyle: 'Casual-polite feminine Japanese. Uses ～かな, ～だよね, ～ちゃった. Gets more casual as comfort builds.',
      relationship: 'First date from a dating app',
      voiceId: 'RWZ1lnBIIgPBTpyCnKn2',
      avatar: '/characters/mika.png',
    },
    setting: 'A stylish cafe in Daikanyama with exposed brick, hanging plants, and specialty lattes.',
    settingJP: '代官山のおしゃれなカフェ。レンガの壁、吊り下げの植物、スペシャルティラテ。',
    userGoal: 'Have a natural, fun conversation. Share interests, give genuine compliments, and suggest a second date.',
    openingLine: 'あ、もしかして…？はじめまして！写真と同じだ、よかった〜。ここ来たことある？',
    openingLineEN: 'Oh, could it be...? Nice to meet you! You look like your photos, that\'s a relief. Have you been here before?',
    culturalNotes: [
      'Japanese dates are often more reserved at first — no strong physical contact expected.',
      'Splitting the bill (割り勘) is common, but offering to pay is also appreciated.',
      '「また会いたいです」(I\'d like to meet again) is a polite way to express interest.',
      'Complimenting taste (センスいいね) works better than direct appearance compliments in early dating.',
    ],
    tweaks: [
      {
        id: 'vibe',
        label: 'Date vibe',
        type: 'select',
        options: ['Relaxed & fun', 'Romantic & earnest', 'Slightly awkward (realistic!)'],
        defaultValue: 'Relaxed & fun',
        promptInjection: 'The date vibe is {value}. Adjust Aoi\'s energy, how quickly she opens up, and conversation flow accordingly.',
      },
      {
        id: 'shared-interest',
        label: 'Shared interest to bond over',
        type: 'select',
        options: ['Travel', 'Music / concerts', 'Food & cafes', 'Art & design', 'Anime'],
        defaultValue: 'Food & cafes',
        promptInjection: 'You both discover a shared interest in {value}. Build conversation around this naturally.',
      },
    ],
    color: '#E91E63',
    gradient: 'from-pink-500 to-rose-500',
  },

  // ── Pop Culture ───────────────────────────────────────────────────────
  {
    id: 'manga-shop',
    category: 'Pop Culture',
    categoryEmoji: '🎮',
    title: 'Manga Shop',
    titleJP: '漫画ショップ',
    description: 'Browse a manga store, ask for recommendations, and discuss your favorite series with the staff.',
    emoji: '📚',
    difficulty: 'intermediate',
    estimatedMinutes: 7,
    tags: ['manga vocab', 'recommendations', 'opinions', 'genre talk'],
    character: {
      name: 'Ren',
      nameJP: 'れん',
      description: 'A passionate manga shop clerk who has read everything and can match anyone with the perfect series.',
      personality: 'Nerdy, enthusiastic, talks fast when excited about recommendations. Very knowledgeable.',
      speechStyle: 'Casual-polite with otaku flair. Uses ～っすよ, マジで, やばい. Gets excited and speeds up.',
      relationship: 'Shop clerk / fellow manga fan',
      voiceId: 'LIisRj2veIKEBdr6KZ5y',
      avatar: '/characters/ren.png',
    },
    setting: 'A multi-floor manga shop in Akihabara. Shelves packed floor to ceiling, new release displays, and a cozy reading corner.',
    settingJP: '秋葉原の複数階の漫画ショップ。天井まで本棚がぎっしり、新刊コーナー、居心地のいい読書スペース。',
    userGoal: 'Find a new manga series to read based on your interests and have a fun conversation about favorites.',
    openingLine: 'いらっしゃいませ〜！あ、何かお探しですか？新刊コーナー、今週やばいのいっぱい入ってますよ！',
    openingLineEN: 'Welcome! Oh, looking for something? The new arrivals this week are incredible, we got tons of great stuff!',
    culturalNotes: [
      'Manga genres: 少年 (shounen), 少女 (shoujo), 青年 (seinen), 女性 (josei) target different demographics.',
      'Reading manga in-store (立ち読み) is increasingly discouraged — many are shrink-wrapped.',
      'Japanese manga reads right-to-left, which the clerk might mention for beginners.',
      'Limited editions (限定版) and special covers (特装版) are popular collector items.',
    ],
    tweaks: [
      {
        id: 'genre',
        label: 'Preferred genre',
        type: 'select',
        options: ['Action / shounen', 'Romance / shoujo', 'Horror / thriller', 'Slice of life', 'Sci-fi / fantasy'],
        defaultValue: 'Action / shounen',
        promptInjection: 'The user prefers {value} manga. Ren should give recommendations in this genre and discuss related series.',
      },
      {
        id: 'reading-level',
        label: 'Japanese reading ability',
        type: 'select',
        options: ['Beginner (furigana needed)', 'Intermediate (some kanji OK)', 'Advanced (no furigana needed)'],
        defaultValue: 'Beginner (furigana needed)',
        promptInjection: 'The user\'s reading level is {value}. Ren should recommend manga appropriate to this level and mention furigana availability.',
      },
    ],
    color: '#9B59B6',
    gradient: 'from-purple-500 to-purple-700',
  },
  {
    id: 'game-center',
    category: 'Pop Culture',
    categoryEmoji: '🎮',
    title: 'Game Center',
    titleJP: 'ゲームセンター',
    description: 'Play crane games and arcade games with a new friend. Learn gaming vocab and trash talk.',
    emoji: '🕹️',
    difficulty: 'intermediate',
    estimatedMinutes: 7,
    tags: ['gaming vocab', 'exclamations', 'casual speech', 'slang'],
    character: {
      name: 'Ren',
      nameJP: 'れん',
      description: 'An upbeat arcade regular who knows all the tricks for crane games and fighting games.',
      personality: 'Competitive, playful, dramatic reactions. Celebrates wins loudly and takes losses with humor.',
      speechStyle: 'Very casual masculine Japanese. Uses ～じゃん, まじかよ, うわ〜, やった. Lots of exclamations and sound effects.',
      relationship: 'New friend you met at the arcade',
      voiceId: 'LIisRj2veIKEBdr6KZ5y',
      avatar: '/characters/ren.png',
    },
    setting: 'A neon-lit multi-story game center in Shinjuku. Crane games on floor 1, rhythm games on floor 2, fighting games in the basement.',
    settingJP: '新宿のネオンが光る複数階のゲームセンター。1階にクレーンゲーム、2階にリズムゲーム、地下に格闘ゲーム。',
    userGoal: 'Have fun playing games, learn casual exclamations, and plan to come back together.',
    openingLine: 'おっ、一人？もったいないじゃん！俺だいき。一緒にやろうぜ！あのクレーンゲーム、コツ教えてやるよ！',
    openingLineEN: 'Hey, alone? That\'s no fun! I\'m Daiki. Let\'s play together! I\'ll teach you the trick to that crane game!',
    culturalNotes: [
      'Game centers (ゲーセン) are a major part of Japanese entertainment culture.',
      'Crane games (UFOキャッチャー) have specific techniques — the staff may reposition prizes for you if you ask.',
      'Many game centers have purikura (photo booths) that are popular with friends.',
      'It\'s common to spend hours at a game center — it\'s a legitimate hangout spot.',
    ],
    tweaks: [
      {
        id: 'game-type',
        label: 'What to play',
        type: 'select',
        options: ['Crane games', 'Fighting games', 'Rhythm games', 'All of them!'],
        defaultValue: 'All of them!',
        promptInjection: 'Focus the arcade session on {value}. Daiki should suggest and guide accordingly.',
      },
      {
        id: 'competitive',
        label: 'Competitive mode',
        type: 'toggle',
        defaultValue: true,
        promptInjection: 'If enabled, Daiki is competitive and playfully trash-talks. If disabled, he\'s more cooperative and encouraging.',
      },
    ],
    color: '#00CED1',
    gradient: 'from-cyan-400 to-teal-500',
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
  { id: 'takeshi', name: 'Takeshi', nameJP: 'たけし', emoji: '🍜', voiceId: 'JOcmGzB8OFjY8MhjHHEf', avatar: '/Takeshi1.png', description: 'Gruff but friendly ramen chef in his 50s', personality: 'Warm, loud, proud. Short punchy sentences.', speechStyle: 'Casual masculine Japanese. だ/だよ endings, omits particles.' },
  { id: 'yuki', name: 'Yuki', nameJP: 'ゆき', emoji: '🏪', voiceId: 'EkK6wL8GaH8IgBZTTDGJ', avatar: '/Yuki1.png', description: 'Cheerful college student, curious and enthusiastic', personality: 'Energetic, giggly, asks lots of questions.', speechStyle: 'Young casual-polite. ～んですか, ～だよね, some slang.' },
  { id: 'kenji', name: 'Kenji', nameJP: 'けんじ', emoji: '🍻', voiceId: '8BU0fsFBiPt1cbGZ5lK9', avatar: '/Kenji1.png', description: 'Outgoing coworker in his 30s who loves food', personality: 'Fun, loud after a beer, great organizer.', speechStyle: 'Casual-polite mix. ～しない？ suggestions, English loanwords.' },
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
