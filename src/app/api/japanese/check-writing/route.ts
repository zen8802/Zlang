import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/japanese/check-writing
 *
 * Uses Google Cloud Vision OCR to validate that the drawn character matches
 * the expected character. Falls back to auto-pass when the API key isn't
 * configured or the request fails — we never want learning to be blocked
 * by infrastructure issues.
 */
export async function POST(req: NextRequest) {
  const { imageData, expectedCharacter } = await req.json()

  if (!imageData || !expectedCharacter) {
    return NextResponse.json({ correct: false, reason: 'missing_input' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY
  if (!apiKey) {
    // Vision API not configured — pass automatically so the user isn't blocked.
    return NextResponse.json({ correct: true, fallback: true })
  }

  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageData },
            features: [{ type: 'TEXT_DETECTION', maxResults: 10 }],
            imageContext: { languageHints: ['ja'] },
          }],
        }),
      },
    )

    const data = await res.json()
    const detectedText: string =
      data?.responses?.[0]?.fullTextAnnotation?.text || ''

    const normalized = detectedText.replace(/\s/g, '')
    const correct = normalized.includes(expectedCharacter)

    return NextResponse.json({ correct, detected: normalized })
  } catch {
    // On unexpected error, don't block the user
    return NextResponse.json({ correct: true, fallback: true })
  }
}
