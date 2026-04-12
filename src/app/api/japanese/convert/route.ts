import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Process-level cache so repeat conversions in the same session don't burn
// API calls. Bounded to ~500 entries to avoid leaking memory across long
// dev sessions; oldest entries get pruned via simple FIFO.
const MAX_CACHE = 500
const cache = new Map<string, KanjiCandidate[]>()

interface KanjiCandidate {
  text: string
  reading: string
}

export async function GET(req: NextRequest) {
  const reading = req.nextUrl.searchParams.get('reading')?.trim() || ''
  if (!reading || reading.length < 2) {
    return NextResponse.json({ candidates: [] })
  }

  if (cache.has(reading)) {
    return NextResponse.json({ candidates: cache.get(reading) })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ candidates: [{ text: reading, reading }] })
  }

  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Convert this hiragana to kanji candidates like a Japanese IME would.

Reading: ${reading}

Return ONLY a valid JSON array of up to 6 candidates, most common first.
Format:
[
  {"text": "kanji or kana form", "reading": "${reading}"},
  ...
]

Include in this priority order:
1. The most common kanji conversion of EXACTLY this reading
2. Alternative kanji with the same reading
3. Common compound words that START with this reading (their reading field can be longer)
4. The original hiragana itself (always include as the last candidate)

Example for かいしゃ:
[
  {"text": "会社", "reading": "かいしゃ"},
  {"text": "会社員", "reading": "かいしゃいん"},
  {"text": "かいしゃ", "reading": "かいしゃ"}
]

No commentary. No markdown fences. Just the JSON array.`,
        },
      ],
    })

    const text = res.content[0].type === 'text' ? res.content[0].text : '[]'
    const cleaned = text.replace(/```json|```/g, '').trim()
    let candidates: KanjiCandidate[] = []
    try {
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) {
        candidates = parsed
          .filter(
            (c) => c && typeof c.text === 'string' && typeof c.reading === 'string',
          )
          .slice(0, 6)
      }
    } catch {
      candidates = [{ text: reading, reading }]
    }

    if (candidates.length === 0) {
      candidates = [{ text: reading, reading }]
    }

    // Bounded LRU-ish cache
    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value
      if (firstKey !== undefined) cache.delete(firstKey)
    }
    cache.set(reading, candidates)

    return NextResponse.json({ candidates })
  } catch {
    return NextResponse.json({
      candidates: [{ text: reading, reading }],
    })
  }
}
