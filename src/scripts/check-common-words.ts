import { GRADE_1_KANJI } from '../data/kyouiku-kanji'

let missing = 0
for (const k of GRADE_1_KANJI) {
  for (const w of k.commonWords) {
    if (!w.english) {
      console.log('MISSING english:', k.character, '→', w.word, w.reading)
      missing++
    }
  }
}
console.log('Total missing:', missing)
console.log('Total entries:', GRADE_1_KANJI.reduce((n, k) => n + k.commonWords.length, 0))
