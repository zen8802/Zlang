'use client'

import { InspectorField, INPUT_CLASS, TEXTAREA_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CultureNoteBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const addRelatedWord = () => {
    const relatedWords = [...(block.relatedWords || []), '']
    onChange({ ...block, relatedWords })
  }

  const updateRelatedWord = (i: number, val: string) => {
    const relatedWords = [...(block.relatedWords || [])]
    relatedWords[i] = val
    onChange({ ...block, relatedWords })
  }

  const deleteRelatedWord = (i: number) => {
    onChange({ ...block, relatedWords: block.relatedWords.filter((_: unknown, idx: number) => idx !== i) })
  }

  return (
    <div className="space-y-3">
      <InspectorField label="Emoji">
        <input value={block.emoji || ''} onChange={e => onChange({ ...block, emoji: e.target.value })} placeholder="e.g. 🏯" className={INPUT_CLASS} />
      </InspectorField>
      <InspectorField label="Headline">
        <input value={block.headline || ''} onChange={e => onChange({ ...block, headline: e.target.value })} className={INPUT_CLASS} />
      </InspectorField>
      <InspectorField label="Body">
        <textarea value={block.body || ''} onChange={e => onChange({ ...block, body: e.target.value })} rows={5} className={TEXTAREA_CLASS} />
      </InspectorField>
      <InspectorField label="Never in textbook">
        <textarea value={block.neverInTextbook || ''} onChange={e => onChange({ ...block, neverInTextbook: e.target.value })} rows={3} placeholder="Something you'd never find in a textbook..." className={TEXTAREA_CLASS} />
      </InspectorField>

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Related words ({block.relatedWords?.length || 0})</p>
        <button onClick={addRelatedWord} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>
      {(block.relatedWords || []).map((w: string, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <input value={w} onChange={e => updateRelatedWord(i, e.target.value)} className={INPUT_CLASS} />
          <button onClick={() => deleteRelatedWord(i)} className="text-red-400/60 hover:text-red-400 text-xs shrink-0">✕</button>
        </div>
      ))}
    </div>
  )
}
