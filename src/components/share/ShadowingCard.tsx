'use client'

import { useState } from 'react'

interface SpeechRecognitionResult {
  results: Array<Array<{ transcript: string }>>
}

export default function ShadowingCard({ shadowing }: { shadowing: Record<string, unknown> | null }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')

  if (!shadowing) return null

  const breakDown = (shadowing.breakDown || []) as Array<Record<string, string>>

  const startListening = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'ja-JP'
    recognition.onresult = (e: SpeechRecognitionResult) => {
      setTranscript(e.results[0][0].transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  return (
    <div className="glass-card p-5">
      <h3 className="font-display font-bold text-accent mb-4">Shadow This</h3>

      <div className="text-center p-6 bg-black/[0.03] rounded-xl mb-4">
        <p className="text-2xl mb-2 font-jp">{shadowing.targetSentence as string}</p>
        <p className="text-xs text-foreground/40">{shadowing.whyThisSentence as string}</p>
      </div>

      {breakDown.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {breakDown.map((chunk, i) => (
            <div key={i} className="bg-accent/5 rounded-lg p-2 text-center">
              <p className="text-sm font-medium font-jp">{chunk.chunk}</p>
              <p className="text-xs text-foreground/40">{chunk.tip}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={startListening}
        className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
          listening ? 'bg-red-500 animate-pulse' : ''
        }`}
        style={listening ? undefined : { backgroundColor: '#1B4F8A' }}
      >
        {listening ? 'Listening...' : 'Try it'}
      </button>

      {transcript && (
        <div className="mt-3 p-3 bg-black/[0.03] rounded-xl">
          <p className="text-xs text-foreground/30 mb-1">You said:</p>
          <p className="text-lg font-jp">{transcript}</p>
        </div>
      )}
    </div>
  )
}
