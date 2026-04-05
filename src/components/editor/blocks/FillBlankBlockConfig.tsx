'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS, TEXTAREA_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FillBlankBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const addSentence = () => {
    const sentences = [...(block.sentences || []), { before: '', answer: '', after: '', hint: '', explanation: '' }]
    onChange({ ...block, sentences })
    setExpanded(sentences.length - 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSentence = (i: number, s: any) => {
    const sentences = [...(block.sentences || [])]
    sentences[i] = s
    onChange({ ...block, sentences })
  }

  const deleteSentence = (i: number) => {
    onChange({ ...block, sentences: block.sentences.filter((_: unknown, idx: number) => idx !== i) })
    setExpanded(null)
  }

  return (
    <div className="space-y-3">
      <InspectorField label="Title">
        <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })} className={INPUT_CLASS} />
      </InspectorField>
      <InspectorField label="Instruction">
        <textarea value={block.instruction || ''} onChange={e => onChange({ ...block, instruction: e.target.value })} rows={2} className={TEXTAREA_CLASS} />
      </InspectorField>

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sentences ({block.sentences?.length || 0})</p>
        <button onClick={addSentence} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(block.sentences || []).map((s: any, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] overflow-hidden">
          <button className="w-full flex items-center justify-between p-3" onClick={() => setExpanded(expanded === i ? null : i)}>
            <span className="text-white text-sm font-bold truncate max-w-[200px]">{s.before ? `${s.before}___${s.after}` : `Sentence ${i + 1}`}</span>
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); deleteSentence(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{expanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 mt-0">
              <div className="mt-2">
                <InspectorField label="Before blank"><input value={s.before || ''} onChange={e => updateSentence(i, { ...s, before: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              </div>
              <InspectorField label="Answer"><input value={s.answer || ''} onChange={e => updateSentence(i, { ...s, answer: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              <InspectorField label="After blank"><input value={s.after || ''} onChange={e => updateSentence(i, { ...s, after: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              <InspectorField label="Hint"><input value={s.hint || ''} onChange={e => updateSentence(i, { ...s, hint: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              <InspectorField label="Explanation"><textarea value={s.explanation || ''} onChange={e => updateSentence(i, { ...s, explanation: e.target.value })} rows={2} className={TEXTAREA_CLASS} /></InspectorField>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
