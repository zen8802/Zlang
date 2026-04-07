// ---------------------------------------------------------------------------
// Scenario Studio — scenario definitions
// ---------------------------------------------------------------------------

export interface StudioCharacter {
  name: string
  nameJP: string
  description: string
  personality: string
  speechStyle: string
  relationship: string
}

export interface StudioTweak {
  id: string
  label: string
  type: 'toggle' | 'slider' | 'select'
  options?: string[]
  promptInjection: (value: string | number | boolean) => string
}

export interface StudioScenario {
  id: string
  title: string
  titleJP: string
  emoji: string
  description: string
  setting: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  character: StudioCharacter
  tweaks: StudioTweak[]
  openingLine: string
}

// ---------------------------------------------------------------------------
// Built-in scenarios
// ---------------------------------------------------------------------------

export const studioScenarios: StudioScenario[] = [
  {
    id: 'combini-clerk',
    title: 'Convenience Store',
    titleJP: 'コンビニ',
    emoji: '🏪',
    description: 'Buy lunch at a Tokyo convenience store',
    setting: 'A busy FamilyMart in Shibuya at noon. There is a line behind you.',
    difficulty: 'beginner',
    character: {
      name: 'Yuki',
      nameJP: '田中ゆき',
      description: 'A part-time convenience store clerk, university student, always cheerful.',
      personality: 'Friendly, patient, slightly energetic',
      speechStyle: 'Polite (desu/masu), fast but clear, standard Tokyo dialect',
      relationship: 'Store clerk to customer — polite but efficient',
    },
    tweaks: [
      {
        id: 'rush',
        label: 'Rush hour pressure',
        type: 'toggle',
        promptInjection: (v) =>
          v === true
            ? 'There is a long line. The clerk is polite but visibly hurried. She subtly rushes the interaction.'
            : '',
      },
      {
        id: 'points-card',
        label: 'Points card upsell',
        type: 'toggle',
        promptInjection: (v) =>
          v === true
            ? 'The clerk asks about a points card (ポイントカード) and tries to sign the learner up.'
            : '',
      },
    ],
    openingLine:
      'いらっしゃいませ！お弁当温めますか？',
  },
  {
    id: 'izakaya-senpai',
    title: 'After-Work Drinks',
    titleJP: '居酒屋',
    emoji: '🍶',
    description: 'Drinks with a senior coworker at an izakaya',
    setting:
      'A cozy izakaya near the office. It is Friday evening. Your senpai invited you for drinks after a tough week.',
    difficulty: 'intermediate',
    character: {
      name: 'Takeshi',
      nameJP: '山田たけし',
      description:
        'Your senpai at work. 35 years old, 10 years at the company. Loves craft beer and complaining about management.',
      personality: 'Warm but blunt, likes to give life advice, gets more casual after a beer',
      speechStyle:
        'Starts with polite speech, shifts to casual (タメ口) as drinks flow. Uses よ and ぞ sentence enders.',
      relationship: 'Senpai to kouhai — expects some deference but genuinely cares',
    },
    tweaks: [
      {
        id: 'drinks',
        label: 'How many beers in',
        type: 'slider',
        promptInjection: (v) => {
          const n = Number(v)
          if (n <= 1) return 'Takeshi is sober and fairly formal.'
          if (n <= 3) return 'Takeshi has had a few drinks. He is loosening up, mixing casual and polite speech.'
          return 'Takeshi is tipsy. He speaks almost entirely in casual form, slurs slightly, and gets philosophical.'
        },
      },
      {
        id: 'gossip',
        label: 'Office gossip mode',
        type: 'toggle',
        promptInjection: (v) =>
          v === true
            ? 'Takeshi wants to gossip about the new department head. He lowers his voice and uses indirect language.'
            : '',
      },
    ],
    openingLine:
      'おつかれ〜！まぁ座れよ。今日何飲む？とりあえずビール？',
  },
  {
    id: 'lost-tourist',
    title: 'Lost in Kyoto',
    titleJP: '道に迷った',
    emoji: '🗺️',
    description: 'Ask a local for directions in Kyoto',
    setting:
      'A quiet residential street in Kyoto. You are trying to find Kinkaku-ji but took a wrong turn. An elderly woman is tending her garden.',
    difficulty: 'beginner',
    character: {
      name: 'Fumiko',
      nameJP: '佐藤ふみこ',
      description:
        'A retired schoolteacher, 72 years old. Loves chatting with young people and foreigners.',
      personality: 'Warm, talkative, slightly nosy, proud of Kyoto',
      speechStyle:
        'Gentle Kansai dialect, speaks slowly and clearly, uses ですわ and はりますか',
      relationship: 'Friendly stranger — treats the learner almost like a grandchild',
    },
    tweaks: [
      {
        id: 'dialect',
        label: 'Kansai dialect strength',
        type: 'select',
        options: ['mild', 'moderate', 'full'],
        promptInjection: (v) => {
          if (v === 'mild') return 'Use only a hint of Kansai dialect. Mostly standard Japanese.'
          if (v === 'moderate') return 'Use moderate Kansai dialect — おおきに, ちゃう, あかん mixed in.'
          return 'Speak in full Kansai dialect. Use はる, おおきに, なんでやねん, ちゃう freely.'
        },
      },
      {
        id: 'invite-tea',
        label: 'She invites you for tea',
        type: 'toggle',
        promptInjection: (v) =>
          v === true
            ? 'After giving directions, Fumiko insists the learner come inside for tea. She will not take no for an answer easily.'
            : '',
      },
    ],
    openingLine:
      'あら、どうしはったん？迷ってはるの？',
  },
  {
    id: 'job-interview',
    title: 'Job Interview',
    titleJP: '面接',
    emoji: '👔',
    description: 'A formal job interview at a Japanese company',
    setting:
      'A clean, minimalist meeting room at a mid-size Tokyo tech company. Two interviewers sit across from you.',
    difficulty: 'advanced',
    character: {
      name: 'Suzuki',
      nameJP: '鈴木部長',
      description:
        'Department head, 48 years old. Former engineer turned manager. Values precision and humility.',
      personality: 'Formal, observant, fair but demanding. Tests candidates with curveball questions.',
      speechStyle:
        'Very formal keigo. Uses ございます, いただけますか, and expects the same level back.',
      relationship: 'Interviewer to candidate — professional power dynamic',
    },
    tweaks: [
      {
        id: 'pressure',
        label: 'Pressure interview style',
        type: 'toggle',
        promptInjection: (v) =>
          v === true
            ? 'Suzuki deliberately asks difficult follow-up questions and stays stone-faced to test composure.'
            : '',
      },
      {
        id: 'group',
        label: 'Group interview (second interviewer)',
        type: 'toggle',
        promptInjection: (v) =>
          v === true
            ? 'A second interviewer, 佐々木さん (young, friendly HR), occasionally asks softer questions as a contrast.'
            : '',
      },
    ],
    openingLine:
      '本日はお越しいただきありがとうございます。では、まず自己紹介をお願いいたします。',
  },
  {
    id: 'date-cafe',
    title: 'First Date at a Cafe',
    titleJP: '初デート',
    emoji: '☕',
    description: 'A casual first date at a trendy Tokyo cafe',
    setting:
      'A stylish cafe in Shimokitazawa. You matched on a dating app and this is your first time meeting.',
    difficulty: 'intermediate',
    character: {
      name: 'Mika',
      nameJP: '中村みか',
      description:
        '28 years old, works in graphic design. Loves cats, indie music, and travel.',
      personality: 'A bit shy at first, witty once comfortable, uses lots of modern slang',
      speechStyle:
        'Casual polite at first (ですます), shifts to casual. Uses ね, よね, and trendy expressions like マジ, やばい, エモい.',
      relationship: 'First date — friendly but evaluating compatibility',
    },
    tweaks: [
      {
        id: 'shyness',
        label: 'How shy is she',
        type: 'select',
        options: ['confident', 'normal', 'very shy'],
        promptInjection: (v) => {
          if (v === 'confident') return 'Mika is confident and talkative from the start.'
          if (v === 'very shy') return 'Mika gives short answers at first. The learner needs to carry the conversation to make her open up.'
          return 'Mika is a little nervous but warms up normally.'
        },
      },
      {
        id: 'awkward-moment',
        label: 'Trigger an awkward moment',
        type: 'toggle',
        promptInjection: (v) =>
          v === true
            ? 'At some point Mika accidentally mentions her ex. She gets flustered. The learner needs to navigate the moment gracefully.'
            : '',
      },
    ],
    openingLine:
      'あ、もしかして…？はじめまして！写真と同じだ。よかった〜笑',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getScenarioById(id: string): StudioScenario | undefined {
  return studioScenarios.find((s) => s.id === id)
}
