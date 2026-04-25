// ---------------------------------------------------------------------------
// Dialogue text segmentation for underline-based highlighting.
//
// Takes raw Japanese text from a character's speech and produces annotated
// segments so the renderer knows which characters get gold (new kana),
// green (new phrase), or dictionary underlines.
// ---------------------------------------------------------------------------

export interface DialogueSegment {
  text: string
  isPhrase: boolean
  newKanaChars: string[]
  hasDictionary: boolean
  isKanji: boolean
  reading?: string
}

interface HighlightConfig {
  lessonKana: string[]
  learnedKana: string[]
  seenKana: string[]
  newPhrases: string[]
}

export function segmentDialogueText(
  text: string,
  config: HighlightConfig,
): DialogueSegment[] {
  const { lessonKana, newPhrases } = config
  const lessonKanaSet = new Set(lessonKana)

  // Sort phrases by length descending so longer matches win
  const sortedPhrases = Array.from(new Set(newPhrases)).sort(
    (a, b) => b.length - a.length,
  )

  const segments: DialogueSegment[] = []
  let i = 0
  const chars = Array.from(text)

  while (i < chars.length) {
    // Try to match a phrase starting at position i
    const remaining = chars.slice(i).join('')
    let phraseMatched = false

    for (const phrase of sortedPhrases) {
      if (remaining.startsWith(phrase)) {
        const phraseChars = Array.from(phrase)
        const newKanaInPhrase = phraseChars.filter((c) => {
          const code = c.charCodeAt(0)
          const isKana =
            (code >= 0x3041 && code <= 0x3096) ||
            (code >= 0x30a0 && code <= 0x30ff)
          return isKana && lessonKanaSet.has(c)
        })

        segments.push({
          text: phrase,
          isPhrase: true,
          newKanaChars: newKanaInPhrase,
          hasDictionary: true,
          isKanji: false,
        })

        i += phraseChars.length
        phraseMatched = true
        break
      }
    }

    if (phraseMatched) continue

    const char = chars[i]
    const code = char.charCodeAt(0)
    const isHiragana = code >= 0x3041 && code <= 0x3096
    const isKatakana = code >= 0x30a0 && code <= 0x30ff
    const isKanji = code >= 0x4e00 && code <= 0x9fff
    const isKana = isHiragana || isKatakana
    const isNewKanaForLesson = isKana && lessonKanaSet.has(char)

    segments.push({
      text: char,
      isPhrase: false,
      newKanaChars: isNewKanaForLesson ? [char] : [],
      hasDictionary: isKanji,
      isKanji,
    })
    i++
  }

  return segments
}

/**
 * Find expression phrases from the vocabulary list that appear in the text
 * and are NOT yet in the user's collection.
 */
export function findNewPhrasesInText(
  text: string,
  userKnownPhrases: string[],
  allExpressions: { word: string; reading: string }[],
): string[] {
  const knownSet = new Set(userKnownPhrases)
  const found: string[] = []

  for (const expr of allExpressions) {
    if (
      (text.includes(expr.word) || text.includes(expr.reading)) &&
      !knownSet.has(expr.word) &&
      !found.includes(expr.word)
    ) {
      found.push(expr.word)
    }
  }

  return found
}
