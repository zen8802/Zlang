'use client'

import { useState } from 'react'

export default function VocabDeck({ vocab }: { vocab: Array<Record<string, unknown>> }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})

  if (!vocab?.length) return <p className="text-center text-foreground/30 py-8">No vocab for this lesson</p>

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-accent">Vocabulary</h3>
      {vocab.map((word, i) => (
        <div
          key={i}
          onClick={() => setFlipped((p) => ({ ...p, [i]: !p[i] }))}
          className="glass-card p-4 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xl font-bold font-jp">{word.word as string}</span>
              <span className="text-sm text-foreground/40 ml-2">{word.reading as string}</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
              {word.jlptLevel as string}
            </span>
          </div>

          <div className={`overflow-hidden transition-all duration-300 ${flipped[i] ? 'max-h-24 mt-2' : 'max-h-0'}`}>
            <p className="text-sm text-foreground/70 font-medium">{word.english as string}</p>
            {typeof word.memoryHook === 'string' && (
              <p className="text-xs text-foreground/40 mt-1 italic">{word.memoryHook as string}</p>
            )}
          </div>

          <p className="text-xs text-foreground/20 mt-2">{flipped[i] ? 'tap to hide' : 'tap to reveal'}</p>
        </div>
      ))}
    </div>
  )
}
