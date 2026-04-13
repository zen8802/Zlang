// ---------------------------------------------------------------------------
// The complete gojūon grid — traditional Japanese 五十音 order.
// Used by the collection page to render the hiragana/katakana discovery grid.
// Null entries are empty cells (や行 and わ行 have gaps).
// ---------------------------------------------------------------------------

export interface KanaCell {
  character: string
  romaji: string
  row: number   // 1-10 (あ行 through わ行)
  col: number   // 1-5 (a, i, u, e, o)
  group: string // 'a-row', 'ka-row', etc.
}

export const HIRAGANA_GRID: (KanaCell | null)[][] = [
  // Row 1 — あ行
  [
    { character: 'あ', romaji: 'a', row: 1, col: 1, group: 'a-row' },
    { character: 'い', romaji: 'i', row: 1, col: 2, group: 'a-row' },
    { character: 'う', romaji: 'u', row: 1, col: 3, group: 'a-row' },
    { character: 'え', romaji: 'e', row: 1, col: 4, group: 'a-row' },
    { character: 'お', romaji: 'o', row: 1, col: 5, group: 'a-row' },
  ],
  // Row 2 — か行
  [
    { character: 'か', romaji: 'ka', row: 2, col: 1, group: 'ka-row' },
    { character: 'き', romaji: 'ki', row: 2, col: 2, group: 'ka-row' },
    { character: 'く', romaji: 'ku', row: 2, col: 3, group: 'ka-row' },
    { character: 'け', romaji: 'ke', row: 2, col: 4, group: 'ka-row' },
    { character: 'こ', romaji: 'ko', row: 2, col: 5, group: 'ka-row' },
  ],
  // Row 3 — さ行
  [
    { character: 'さ', romaji: 'sa', row: 3, col: 1, group: 'sa-row' },
    { character: 'し', romaji: 'shi', row: 3, col: 2, group: 'sa-row' },
    { character: 'す', romaji: 'su', row: 3, col: 3, group: 'sa-row' },
    { character: 'せ', romaji: 'se', row: 3, col: 4, group: 'sa-row' },
    { character: 'そ', romaji: 'so', row: 3, col: 5, group: 'sa-row' },
  ],
  // Row 4 — た行
  [
    { character: 'た', romaji: 'ta', row: 4, col: 1, group: 'ta-row' },
    { character: 'ち', romaji: 'chi', row: 4, col: 2, group: 'ta-row' },
    { character: 'つ', romaji: 'tsu', row: 4, col: 3, group: 'ta-row' },
    { character: 'て', romaji: 'te', row: 4, col: 4, group: 'ta-row' },
    { character: 'と', romaji: 'to', row: 4, col: 5, group: 'ta-row' },
  ],
  // Row 5 — な行
  [
    { character: 'な', romaji: 'na', row: 5, col: 1, group: 'na-row' },
    { character: 'に', romaji: 'ni', row: 5, col: 2, group: 'na-row' },
    { character: 'ぬ', romaji: 'nu', row: 5, col: 3, group: 'na-row' },
    { character: 'ね', romaji: 'ne', row: 5, col: 4, group: 'na-row' },
    { character: 'の', romaji: 'no', row: 5, col: 5, group: 'na-row' },
  ],
  // Row 6 — は行
  [
    { character: 'は', romaji: 'ha', row: 6, col: 1, group: 'ha-row' },
    { character: 'ひ', romaji: 'hi', row: 6, col: 2, group: 'ha-row' },
    { character: 'ふ', romaji: 'fu', row: 6, col: 3, group: 'ha-row' },
    { character: 'へ', romaji: 'he', row: 6, col: 4, group: 'ha-row' },
    { character: 'ほ', romaji: 'ho', row: 6, col: 5, group: 'ha-row' },
  ],
  // Row 7 — ま行
  [
    { character: 'ま', romaji: 'ma', row: 7, col: 1, group: 'ma-row' },
    { character: 'み', romaji: 'mi', row: 7, col: 2, group: 'ma-row' },
    { character: 'む', romaji: 'mu', row: 7, col: 3, group: 'ma-row' },
    { character: 'め', romaji: 'me', row: 7, col: 4, group: 'ma-row' },
    { character: 'も', romaji: 'mo', row: 7, col: 5, group: 'ma-row' },
  ],
  // Row 8 — や行 (only 3)
  [
    { character: 'や', romaji: 'ya', row: 8, col: 1, group: 'ya-row' },
    null,
    { character: 'ゆ', romaji: 'yu', row: 8, col: 3, group: 'ya-row' },
    null,
    { character: 'よ', romaji: 'yo', row: 8, col: 5, group: 'ya-row' },
  ],
  // Row 9 — ら行
  [
    { character: 'ら', romaji: 'ra', row: 9, col: 1, group: 'ra-row' },
    { character: 'り', romaji: 'ri', row: 9, col: 2, group: 'ra-row' },
    { character: 'る', romaji: 'ru', row: 9, col: 3, group: 'ra-row' },
    { character: 'れ', romaji: 're', row: 9, col: 4, group: 'ra-row' },
    { character: 'ろ', romaji: 'ro', row: 9, col: 5, group: 'ra-row' },
  ],
  // Row 10 — わ行 + ん
  [
    { character: 'わ', romaji: 'wa', row: 10, col: 1, group: 'wa-row' },
    null,
    null,
    { character: 'を', romaji: 'wo', row: 10, col: 4, group: 'wa-row' },
    { character: 'ん', romaji: 'n', row: 10, col: 5, group: 'wa-row' },
  ],
]

export const KATAKANA_GRID: (KanaCell | null)[][] = [
  [
    { character: 'ア', romaji: 'a', row: 1, col: 1, group: 'a-row' },
    { character: 'イ', romaji: 'i', row: 1, col: 2, group: 'a-row' },
    { character: 'ウ', romaji: 'u', row: 1, col: 3, group: 'a-row' },
    { character: 'エ', romaji: 'e', row: 1, col: 4, group: 'a-row' },
    { character: 'オ', romaji: 'o', row: 1, col: 5, group: 'a-row' },
  ],
  [
    { character: 'カ', romaji: 'ka', row: 2, col: 1, group: 'ka-row' },
    { character: 'キ', romaji: 'ki', row: 2, col: 2, group: 'ka-row' },
    { character: 'ク', romaji: 'ku', row: 2, col: 3, group: 'ka-row' },
    { character: 'ケ', romaji: 'ke', row: 2, col: 4, group: 'ka-row' },
    { character: 'コ', romaji: 'ko', row: 2, col: 5, group: 'ka-row' },
  ],
  [
    { character: 'サ', romaji: 'sa', row: 3, col: 1, group: 'sa-row' },
    { character: 'シ', romaji: 'shi', row: 3, col: 2, group: 'sa-row' },
    { character: 'ス', romaji: 'su', row: 3, col: 3, group: 'sa-row' },
    { character: 'セ', romaji: 'se', row: 3, col: 4, group: 'sa-row' },
    { character: 'ソ', romaji: 'so', row: 3, col: 5, group: 'sa-row' },
  ],
  [
    { character: 'タ', romaji: 'ta', row: 4, col: 1, group: 'ta-row' },
    { character: 'チ', romaji: 'chi', row: 4, col: 2, group: 'ta-row' },
    { character: 'ツ', romaji: 'tsu', row: 4, col: 3, group: 'ta-row' },
    { character: 'テ', romaji: 'te', row: 4, col: 4, group: 'ta-row' },
    { character: 'ト', romaji: 'to', row: 4, col: 5, group: 'ta-row' },
  ],
  [
    { character: 'ナ', romaji: 'na', row: 5, col: 1, group: 'na-row' },
    { character: 'ニ', romaji: 'ni', row: 5, col: 2, group: 'na-row' },
    { character: 'ヌ', romaji: 'nu', row: 5, col: 3, group: 'na-row' },
    { character: 'ネ', romaji: 'ne', row: 5, col: 4, group: 'na-row' },
    { character: 'ノ', romaji: 'no', row: 5, col: 5, group: 'na-row' },
  ],
  [
    { character: 'ハ', romaji: 'ha', row: 6, col: 1, group: 'ha-row' },
    { character: 'ヒ', romaji: 'hi', row: 6, col: 2, group: 'ha-row' },
    { character: 'フ', romaji: 'fu', row: 6, col: 3, group: 'ha-row' },
    { character: 'ヘ', romaji: 'he', row: 6, col: 4, group: 'ha-row' },
    { character: 'ホ', romaji: 'ho', row: 6, col: 5, group: 'ha-row' },
  ],
  [
    { character: 'マ', romaji: 'ma', row: 7, col: 1, group: 'ma-row' },
    { character: 'ミ', romaji: 'mi', row: 7, col: 2, group: 'ma-row' },
    { character: 'ム', romaji: 'mu', row: 7, col: 3, group: 'ma-row' },
    { character: 'メ', romaji: 'me', row: 7, col: 4, group: 'ma-row' },
    { character: 'モ', romaji: 'mo', row: 7, col: 5, group: 'ma-row' },
  ],
  [
    { character: 'ヤ', romaji: 'ya', row: 8, col: 1, group: 'ya-row' },
    null,
    { character: 'ユ', romaji: 'yu', row: 8, col: 3, group: 'ya-row' },
    null,
    { character: 'ヨ', romaji: 'yo', row: 8, col: 5, group: 'ya-row' },
  ],
  [
    { character: 'ラ', romaji: 'ra', row: 9, col: 1, group: 'ra-row' },
    { character: 'リ', romaji: 'ri', row: 9, col: 2, group: 'ra-row' },
    { character: 'ル', romaji: 'ru', row: 9, col: 3, group: 'ra-row' },
    { character: 'レ', romaji: 're', row: 9, col: 4, group: 'ra-row' },
    { character: 'ロ', romaji: 'ro', row: 9, col: 5, group: 'ra-row' },
  ],
  [
    { character: 'ワ', romaji: 'wa', row: 10, col: 1, group: 'wa-row' },
    null,
    null,
    { character: 'ヲ', romaji: 'wo', row: 10, col: 4, group: 'wa-row' },
    { character: 'ン', romaji: 'n', row: 10, col: 5, group: 'wa-row' },
  ],
]

export const ROW_LABELS = [
  'あ行', 'か行', 'さ行', 'た行', 'な行',
  'は行', 'ま行', 'や行', 'ら行', 'わ行',
]

export const COL_LABELS = ['a', 'i', 'u', 'e', 'o']
