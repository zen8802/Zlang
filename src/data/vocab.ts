import { VocabItem } from '@/types'

/**
 * Supplementary vocab bank used across lessons.
 * These items may also appear inline in clips but this bank
 * provides a canonical, de-duplicated reference for the SRS system.
 */
export const vocabBank: VocabItem[] = [
  // ============================================================
  // JAPANESE VOCABULARY (25 items)
  // ============================================================

  // --- Beginner ---
  {
    id: 'vb-konnichiwa',
    word: 'こんにちは',
    reading: 'こんにちは',
    meaning: 'Hello / Good afternoon',
    meaningJP: '昼の挨拶',
    exampleSentence: 'こんにちは、元気ですか？',
    exampleTranslation: 'Hello, how are you?',
    level: 'beginner',
    categories: ['travel', 'anime'],
  },
  {
    id: 'vb-arigatou',
    word: 'ありがとうございます',
    reading: 'ありがとうございます',
    meaning: 'Thank you (polite)',
    meaningJP: '感謝の表現（丁寧）',
    exampleSentence: '手伝ってくれてありがとうございます。',
    exampleTranslation: 'Thank you for helping me.',
    level: 'beginner',
    categories: ['travel', 'anime'],
  },
  {
    id: 'vb-gomen',
    word: 'ごめんなさい',
    reading: 'ごめんなさい',
    meaning: "I'm sorry",
    meaningJP: '謝罪の表現',
    exampleSentence: '遅れてごめんなさい。',
    exampleTranslation: "I'm sorry for being late.",
    level: 'beginner',
    categories: ['travel'],
  },
  {
    id: 'vb-oishii',
    word: '美味しい',
    reading: 'おいしい',
    meaning: 'delicious',
    meaningJP: '味が良い',
    exampleSentence: 'このお寿司は本当に美味しい！',
    exampleTranslation: 'This sushi is really delicious!',
    level: 'beginner',
    categories: ['food', 'travel'],
  },
  {
    id: 'vb-kawaii',
    word: 'かわいい',
    reading: 'かわいい',
    meaning: 'cute',
    meaningJP: '可愛らしい',
    exampleSentence: 'この猫かわいい！',
    exampleTranslation: 'This cat is cute!',
    level: 'beginner',
    categories: ['anime', 'travel'],
  },
  {
    id: 'vb-sugoi',
    word: 'すごい',
    reading: 'すごい',
    meaning: 'amazing / awesome',
    meaningJP: '素晴らしい',
    exampleSentence: 'すごい！よくできたね！',
    exampleTranslation: 'Amazing! You did great!',
    level: 'beginner',
    categories: ['anime', 'travel', 'gaming'],
  },
  {
    id: 'vb-nani',
    word: '何',
    reading: 'なに',
    meaning: 'what',
    meaningJP: '何',
    exampleSentence: '何が好きですか？',
    exampleTranslation: 'What do you like?',
    level: 'beginner',
    categories: ['travel', 'anime'],
  },
  {
    id: 'vb-watashi',
    word: '私',
    reading: 'わたし',
    meaning: 'I / me',
    meaningJP: '自分を指す言葉',
    exampleSentence: '私は学生です。',
    exampleTranslation: 'I am a student.',
    level: 'beginner',
    categories: ['travel'],
  },

  // --- Intermediate ---
  {
    id: 'vb-naruhodo',
    word: 'なるほど',
    reading: 'なるほど',
    meaning: 'I see / that makes sense',
    meaningJP: '理解・納得の表現',
    exampleSentence: 'なるほど、そういうことか。',
    exampleTranslation: 'I see, so that\'s how it is.',
    level: 'intermediate',
    categories: ['travel', 'anime'],
  },
  {
    id: 'vb-mendokusai',
    word: '面倒くさい',
    reading: 'めんどうくさい',
    meaning: 'troublesome / what a pain',
    meaningJP: '面倒で嫌なこと',
    exampleSentence: '宿題が面倒くさい。',
    exampleTranslation: 'Homework is such a pain.',
    level: 'intermediate',
    categories: ['anime', 'manga'],
  },
  {
    id: 'vb-natsukashii',
    word: '懐かしい',
    reading: 'なつかしい',
    meaning: 'nostalgic / brings back memories',
    meaningJP: '昔を思い出して懐かしく感じる',
    exampleSentence: 'この曲懐かしい！子供の頃よく聞いた。',
    exampleTranslation: "This song is so nostalgic! I listened to it a lot as a kid.",
    level: 'intermediate',
    categories: ['jpop', 'anime'],
  },
  {
    id: 'vb-mottainai',
    word: 'もったいない',
    reading: 'もったいない',
    meaning: 'what a waste / too good to waste',
    meaningJP: '無駄にするのが惜しい',
    exampleSentence: '食べ物を捨てるのはもったいない。',
    exampleTranslation: "It's wasteful to throw away food.",
    level: 'intermediate',
    categories: ['food', 'nature', 'travel'],
  },
  {
    id: 'vb-kimochi',
    word: '気持ち',
    reading: 'きもち',
    meaning: 'feeling / sensation',
    meaningJP: '感情・感覚',
    exampleSentence: '気持ちいい天気ですね。',
    exampleTranslation: 'The weather feels nice, doesn\'t it?',
    level: 'intermediate',
    categories: ['anime', 'nature'],
  },
  {
    id: 'vb-tsurai',
    word: 'つらい',
    reading: 'つらい',
    meaning: 'painful / tough / hard (emotionally)',
    meaningJP: '精神的に苦しい',
    exampleSentence: '一人で頑張るのはつらい。',
    exampleTranslation: 'Trying hard alone is tough.',
    level: 'intermediate',
    categories: ['anime', 'jdrama'],
  },
  {
    id: 'vb-dame',
    word: 'ダメ',
    reading: 'だめ',
    meaning: 'no good / not allowed',
    meaningJP: 'いけない・良くない',
    exampleSentence: 'ここで写真を撮るのはダメです。',
    exampleTranslation: 'Taking photos here is not allowed.',
    level: 'intermediate',
    categories: ['travel', 'anime'],
  },
  {
    id: 'vb-jouzu',
    word: '上手',
    reading: 'じょうず',
    meaning: 'skillful / good at',
    meaningJP: '技術が高い',
    exampleSentence: '日本語がお上手ですね！',
    exampleTranslation: 'You are good at Japanese!',
    level: 'intermediate',
    categories: ['travel', 'martial-arts'],
  },

  // --- Advanced ---
  {
    id: 'vb-komorebi',
    word: '木漏れ日',
    reading: 'こもれび',
    meaning: 'sunlight filtering through trees',
    meaningJP: '木の葉の間から差し込む日光',
    exampleSentence: '公園で木漏れ日を楽しんだ。',
    exampleTranslation: 'I enjoyed the sunlight filtering through the trees at the park.',
    level: 'advanced',
    categories: ['nature', 'ghibli'],
  },
  {
    id: 'vb-wabisabi',
    word: '侘び寂び',
    reading: 'わびさび',
    meaning: 'beauty in imperfection and transience',
    meaningJP: '不完全さや移り変わりの中の美',
    exampleSentence: 'この古い茶碗には侘び寂びの美しさがある。',
    exampleTranslation: 'This old tea bowl has the beauty of wabi-sabi.',
    level: 'advanced',
    categories: ['nature', 'ghibli'],
  },
  {
    id: 'vb-omotenashi',
    word: 'おもてなし',
    reading: 'おもてなし',
    meaning: 'wholehearted hospitality',
    meaningJP: '心からのもてなし',
    exampleSentence: '日本のおもてなしは世界で有名です。',
    exampleTranslation: 'Japanese hospitality is famous around the world.',
    level: 'advanced',
    categories: ['travel', 'food'],
  },
  {
    id: 'vb-senpai',
    word: '先輩',
    reading: 'せんぱい',
    meaning: 'senior / upperclassman / mentor',
    meaningJP: '年上・上級生',
    exampleSentence: '先輩、教えてください！',
    exampleTranslation: 'Senpai, please teach me!',
    level: 'beginner',
    categories: ['anime', 'manga', 'martial-arts'],
  },
  {
    id: 'vb-itadakimasu',
    word: 'いただきます',
    reading: 'いただきます',
    meaning: 'I humbly receive (said before eating)',
    meaningJP: '食事前の挨拶',
    exampleSentence: 'いただきます！美味しそう！',
    exampleTranslation: "Let's eat! It looks delicious!",
    level: 'beginner',
    categories: ['food', 'travel'],
  },
  {
    id: 'vb-otsukaresama',
    word: 'お疲れ様',
    reading: 'おつかれさま',
    meaning: 'good work / thanks for your effort',
    meaningJP: '労いの表現',
    exampleSentence: '今日もお疲れ様でした。',
    exampleTranslation: 'Thanks for your hard work today.',
    level: 'intermediate',
    categories: ['travel', 'jdrama'],
  },

  // ============================================================
  // ENGLISH VOCABULARY (25 items)
  // ============================================================

  // --- Beginner ---
  {
    id: 'vb-cool',
    word: 'cool',
    meaning: 'good / nice / agreeable (not temperature)',
    meaningJP: 'いいね・かっこいい（温度ではない）',
    exampleSentence: "That's cool, I'm down for that.",
    exampleTranslation: 'いいね、それ賛成。',
    level: 'beginner',
    categories: ['american-life'],
  },
  {
    id: 'vb-vibes',
    word: 'vibes',
    meaning: 'atmosphere / feeling / energy',
    meaningJP: '雰囲気・感じ・エネルギー',
    exampleSentence: 'This place has great vibes.',
    exampleTranslation: 'この場所は雰囲気がいい。',
    level: 'beginner',
    categories: ['american-life', 'tiktok'],
  },
  {
    id: 'vb-nope',
    word: 'nope',
    meaning: 'no (casual / emphatic)',
    meaningJP: 'いいえ（カジュアル・強調）',
    exampleSentence: "Nope, I'm not doing that.",
    exampleTranslation: 'いや、それはやらない。',
    level: 'beginner',
    categories: ['american-life'],
  },
  {
    id: 'vb-myBad',
    word: 'my bad',
    meaning: "my mistake / I'm sorry (casual)",
    meaningJP: '私のミス・ごめん（カジュアル）',
    exampleSentence: "Oh, my bad! I didn't see you there.",
    exampleTranslation: 'あ、ごめん！気づかなかった。',
    level: 'beginner',
    categories: ['american-life', 'nba'],
  },
  {
    id: 'vb-chill',
    word: 'chill',
    meaning: 'relaxed / calm down / hang out',
    meaningJP: 'リラックスした・落ち着いて・遊ぶ',
    exampleSentence: "Let's just chill at my place.",
    exampleTranslation: 'うちでまったりしよう。',
    level: 'beginner',
    categories: ['american-life'],
  },
  {
    id: 'vb-bet',
    word: 'bet',
    meaning: 'okay / sure / agreement (slang)',
    meaningJP: 'オッケー・了解（スラング）',
    exampleSentence: "Meet at 7? Bet.",
    exampleTranslation: '7時に集合？了解。',
    level: 'beginner',
    categories: ['american-life', 'tiktok', 'hiphop'],
  },

  // --- Intermediate ---
  {
    id: 'vb-slay',
    word: 'slay',
    meaning: 'to do something exceptionally well',
    meaningJP: '圧倒的にうまくやる',
    exampleSentence: "She absolutely slayed that presentation.",
    exampleTranslation: 'あのプレゼンを完全に制した。',
    level: 'intermediate',
    categories: ['tiktok', 'fashion'],
  },
  {
    id: 'vb-sus',
    word: 'sus',
    meaning: 'suspicious / shady',
    meaningJP: '怪しい・疑わしい',
    exampleSentence: "That excuse sounds kinda sus.",
    exampleTranslation: 'その言い訳ちょっと怪しくない？',
    level: 'intermediate',
    categories: ['gaming', 'memes', 'tiktok'],
  },
  {
    id: 'vb-goat',
    word: 'GOAT',
    meaning: 'Greatest Of All Time',
    meaningJP: '史上最高',
    exampleSentence: "LeBron is the GOAT, no debate.",
    exampleTranslation: 'レブロンは史上最高、議論の余地なし。',
    level: 'intermediate',
    categories: ['nba', 'gaming'],
  },
  {
    id: 'vb-flex',
    word: 'flex',
    meaning: 'to show off / brag',
    meaningJP: '見せびらかす・自慢する',
    exampleSentence: "He's always flexing his new shoes on Instagram.",
    exampleTranslation: 'あいつインスタでいつも新しい靴を見せびらかしてる。',
    level: 'intermediate',
    categories: ['fashion', 'tiktok', 'hiphop'],
  },
  {
    id: 'vb-salty',
    word: 'salty',
    meaning: 'bitter / upset / annoyed (about a loss)',
    meaningJP: '悔しい・イライラしてる（負けて）',
    exampleSentence: "He's so salty about losing the game.",
    exampleTranslation: '試合に負けてめちゃくちゃ悔しがってる。',
    level: 'intermediate',
    categories: ['gaming', 'nba', 'memes'],
  },
  {
    id: 'vb-shade',
    word: 'throw shade',
    meaning: 'to subtly disrespect or criticize',
    meaningJP: 'さりげなくディスる',
    exampleSentence: "She was throwing shade at him the whole dinner.",
    exampleTranslation: 'ディナー中ずっとあの人のことディスってた。',
    level: 'intermediate',
    categories: ['comedy', 'tiktok'],
  },
  {
    id: 'vb-cringe',
    word: 'cringe',
    meaning: 'embarrassingly awkward',
    meaningJP: '痛々しい・恥ずかしい',
    exampleSentence: "That video was so cringe I had to look away.",
    exampleTranslation: 'あの動画痛すぎて目を逸らした。',
    level: 'intermediate',
    categories: ['memes', 'tiktok'],
  },
  {
    id: 'vb-ate',
    word: 'ate',
    meaning: 'did something perfectly (slang)',
    meaningJP: '完璧にやった（スラング）',
    exampleSentence: "She ate that performance, left no crumbs.",
    exampleTranslation: 'あのパフォーマンス完璧だった、文句なし。',
    level: 'intermediate',
    categories: ['tiktok', 'fashion'],
  },

  // --- Advanced ---
  {
    id: 'vb-gaslighting',
    word: 'gaslighting',
    meaning: 'manipulating someone into doubting their own reality',
    meaningJP: '他人の現実認識を操作して疑わせること',
    exampleSentence: "Stop gaslighting me, I know what I heard.",
    exampleTranslation: 'ガスライティングしないで、自分が聞いたことはわかってる。',
    level: 'advanced',
    categories: ['american-life', 'tiktok'],
  },
  {
    id: 'vb-delusional',
    word: 'delusional',
    meaning: 'believing something unrealistic (often humorous)',
    meaningJP: '妄想してる（ユーモラスに使うことも）',
    exampleSentence: "You think you'll finish that tonight? Delusional.",
    exampleTranslation: '今夜中に終わると思ってるの？妄想だよ。',
    level: 'advanced',
    categories: ['comedy', 'memes'],
  },
  {
    id: 'vb-emotionalDamage',
    word: 'emotional damage',
    meaning: 'humorous response to a devastating insult or truth',
    meaningJP: '壊滅的な侮辱や真実への面白い反応（ミーム）',
    exampleSentence: "'You look like your dad.' 'Emotional damage!'",
    exampleTranslation: '「お父さんに似てるね」「精神的ダメージ！」',
    level: 'advanced',
    categories: ['memes', 'comedy'],
  },
  {
    id: 'vb-passiveAggressive',
    word: 'passive-aggressive',
    meaning: 'expressing anger indirectly',
    meaningJP: '間接的に怒りを表現する',
    exampleSentence: "Her 'fine, whatever' was super passive-aggressive.",
    exampleTranslation: '彼女の「いいよ、別に」はめっちゃ受動攻撃的だった。',
    level: 'advanced',
    categories: ['american-life', 'comedy'],
  },
  {
    id: 'vb-iykyk',
    word: 'IYKYK',
    meaning: 'If You Know, You Know (insider reference)',
    meaningJP: '分かる人には分かる',
    exampleSentence: "That restaurant on 5th street... IYKYK.",
    exampleTranslation: '5番通りのあのレストラン…分かる人には分かる。',
    level: 'advanced',
    categories: ['memes', 'tiktok'],
  },
  {
    id: 'vb-periodt',
    word: 'periodt',
    meaning: 'end of discussion / that is final (emphatic)',
    meaningJP: '以上！終わり！（強調）',
    exampleSentence: "She's the best singer alive, periodt.",
    exampleTranslation: '彼女は今生きてる中で最高の歌手、以上。',
    level: 'advanced',
    categories: ['tiktok', 'hiphop'],
  },
  {
    id: 'vb-cap',
    word: 'cap',
    meaning: 'lie / falsehood (slang)',
    meaningJP: '嘘（スラング）',
    exampleSentence: "That's cap, you never said that.",
    exampleTranslation: '嘘じゃん、そんなこと言ってないでしょ。',
    level: 'intermediate',
    categories: ['tiktok', 'hiphop', 'memes'],
  },
  {
    id: 'vb-rizz',
    word: 'rizz',
    meaning: 'charm / ability to attract someone',
    meaningJP: '魅力・人を惹きつける力',
    exampleSentence: "He's got unspoken rizz.",
    exampleTranslation: '彼には言葉にしない魅力がある。',
    level: 'intermediate',
    categories: ['tiktok', 'american-life'],
  },
  {
    id: 'vb-valid',
    word: 'valid',
    meaning: 'acceptable / understandable / legitimate (slang)',
    meaningJP: 'もっとも・理解できる（スラング）',
    exampleSentence: "You don't like mornings? That's valid.",
    exampleTranslation: '朝が嫌い？それはわかる。',
    level: 'beginner',
    categories: ['american-life', 'tiktok'],
  },
]

// ============================================================
// Helper Functions
// ============================================================

export function getVocabById(id: string): VocabItem | undefined {
  return vocabBank.find(v => v.id === id)
}

export function getVocabByLevel(level: VocabItem['level']): VocabItem[] {
  return vocabBank.filter(v => v.level === level)
}

export function getVocabByCategory(category: string): VocabItem[] {
  return vocabBank.filter(v => v.categories.includes(category))
}

export function getVocabByWord(word: string): VocabItem | undefined {
  return vocabBank.find(v => v.word.toLowerCase() === word.toLowerCase())
}

export function getJapaneseVocab(): VocabItem[] {
  return vocabBank.filter(v => v.reading !== undefined)
}

export function getEnglishVocab(): VocabItem[] {
  return vocabBank.filter(v => v.reading === undefined)
}

export function searchVocab(query: string): VocabItem[] {
  const q = query.toLowerCase()
  return vocabBank.filter(
    v =>
      v.word.toLowerCase().includes(q) ||
      v.meaning.toLowerCase().includes(q) ||
      (v.meaningJP && v.meaningJP.includes(query)) ||
      (v.reading && v.reading.includes(query))
  )
}
