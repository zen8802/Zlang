'use client'

import { InspectorField, INPUT_CLASS, TEXTAREA_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ShadowingBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const addChunk = () => {
    const breakdown = [...(block.breakdown || []), { chunk: '', tip: '' }]
    onChange({ ...block, breakdown })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateChunk = (i: number, c: any) => {
    const breakdown = [...(block.breakdown || [])]
    breakdown[i] = c
    onChange({ ...block, breakdown })
  }

  const deleteChunk = (i: number) => {
    onChange({ ...block, breakdown: block.breakdown.filter((_: unknown, idx: number) => idx !== i) })
  }

  return (
    <div className="space-y-3">
      <InspectorField label="Title">
        <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })} className={INPUT_CLASS} />
      </InspectorField>
      <InspectorField label="Target sentence">
        <input value={block.targetSentence || ''} onChange={e => onChange({ ...block, targetSentence: e.target.value })} className={INPUT_CLASS} style={{ fontFamily: 'Noto Sans JP' }} />
      </InspectorField>
      <InspectorField label="Reading">
        <input value={block.targetReading || ''} onChange={e => onChange({ ...block, targetReading: e.target.value })} className={INPUT_CLASS} />
      </InspectorField>
      <InspectorField label="Romaji">
        <input value={block.targetRomaji || ''} onChange={e => onChange({ ...block, targetRomaji: e.target.value })} className={INPUT_CLASS} />
      </InspectorField>
      <InspectorField label="English">
        <input value={block.targetEnglish || ''} onChange={e => onChange({ ...block, targetEnglish: e.target.value })} className={INPUT_CLASS} />
      </InspectorField>
      <InspectorField label="Why this sentence?">
        <textarea value={block.whyThisSentence || ''} onChange={e => onChange({ ...block, whyThisSentence: e.target.value })} rows={2} className={TEXTAREA_CLASS} />
      </InspectorField>
      <InspectorField label="Emotion context">
        <input value={block.emotionContext || ''} onChange={e => onChange({ ...block, emotionContext: e.target.value })} placeholder="e.g. excited, frustrated" className={INPUT_CLASS} />
      </InspectorField>

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Breakdown chunks ({block.breakdown?.length || 0})</p>
        <button onClick={addChunk} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(block.breakdown || []).map((c: any, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-[10px] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Chunk {i + 1}</span>
            <button onClick={() => deleteChunk(i)} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
          </div>
          <InspectorField label="Chunk"><input value={c.chunk || ''} onChange={e => updateChunk(i, { ...c, chunk: e.target.value })} className={INPUT_CLASS} style={{ fontFamily: 'Noto Sans JP' }} /></InspectorField>
          <InspectorField label="Tip"><input value={c.tip || ''} onChange={e => updateChunk(i, { ...c, tip: e.target.value })} className={INPUT_CLASS} /></InspectorField>
        </div>
      ))}
    </div>
  )
}
