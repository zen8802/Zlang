import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// In-memory cache to avoid repeated Claude calls
const definitionCache = new Map<string, unknown>()

export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get('word') || ''
  const reading = req.nextUrl.searchParams.get('reading') || ''

  if (!word) return NextResponse.json({ definition: null })

  const cacheKey = `${word}:${reading}`
  if (definitionCache.has(cacheKey)) {
    return NextResponse.json({ definition: definitionCache.get(cacheKey) })
  }

  // Check vocabulary_cards table first
  if (process.env.DATABASE_URL) {
    try {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL)

      const rows = await sql`
        SELECT
          word, reading, romaji, english,
          part_of_speech, jlpt_level,
          example_jp, example_en
        FROM vocabulary_cards
        WHERE word = ${word}
          OR reading = ${reading}
          OR reading = ${word}
          OR word = ${reading}
        LIMIT 1
      `

      if (rows.length > 0) {
        const row = rows[0]
        const definition = {
          word: row.word,
          dictionaryForm: row.word,
          reading: row.reading,
          romaji: row.romaji,
          partOfSpeech: row.part_of_speech,
          english: row.english,
          englishAlts: [],
          exampleJP: row.example_jp || null,
          exampleEN: row.example_en || null,
          jlptLevel: row.jlpt_level || null,
          isInVocabDB: true,
        }
        definitionCache.set(cacheKey, definition)
        return NextResponse.json({ definition })
      }
    } catch {
      // Fall through to Claude
    }
  }

  // Not in our database — ask Claude
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ definition: null })
  }

  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Define this Japanese word concisely.
Word: ${word}
Reading: ${reading}

Return ONLY valid JSON:
{
  "word": "${word}",
  "dictionaryForm": "base/dictionary form",
  "reading": "hiragana reading",
  "romaji": "romaji",
  "partOfSpeech": "noun|verb|i-adjective|na-adjective|adverb|expression",
  "english": "primary English meaning",
  "englishAlts": ["alt meaning 1"],
  "exampleJP": "simple example sentence",
  "exampleEN": "English translation of example",
  "jlptLevel": "N5|N4|N3|N2|N1|none",
  "isInVocabDB": false
}`,
        },
      ],
    })

    const text = res.content[0].type === 'text' ? res.content[0].text : ''
    const definition = JSON.parse(text.replace(/```json|```/g, '').trim())
    definitionCache.set(cacheKey, definition)
    return NextResponse.json({ definition })
  } catch {
    return NextResponse.json({ definition: null })
  }
}
