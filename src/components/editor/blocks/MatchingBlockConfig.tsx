'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS, TEXTAREA_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MatchingBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const addPair = () => {
    const pairs = [...(block.pairs || []), { left: '', leftReading: '', right: '' }]
    onChange({ ...block, pairs })
    setExpanded(pairs.length - 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePair = (i: number, p: any) => {
    const pairs = [...(block.pairs || [])]
    pairs[i] = p
    onChange({ ...block, pairs })
  }

  const deletePair = (i: number) => {
    onChange({ ...block, pairs: block.pairs.filter((_: unknown, idx: number) => idx !== i) })
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
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pairs ({block.pairs?.length || 0})</p>
        <button onClick={addPair} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(block.pairs || []).map((p: any, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] overflow-hidden">
          <button className="w-full flex items-center justify-between p-3" onClick={() => setExpanded(expanded === i ? null : i)}>
            <span className="text-white text-sm font-bold">{p.left || 'New pair'} → {p.right || '...'}</span>
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); deletePair(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{expanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 mt-0">
              <div className="mt-2">
                <InspectorField label="Left (JP)"><input value={p.left || ''} onChange={e => updatePair(i, { ...p, left: e.target.value })} className={INPUT_CLASS} style={{ fontFamily: 'Noto Sans JP' }} /></InspectorField>
              </div>
              <InspectorField label="Reading"><input value={p.leftReading || ''} onChange={e => updatePair(i, { ...p, leftReading: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              <InspectorField label="Right (EN)"><input value={p.right || ''} onChange={e => updatePair(i, { ...p, right: e.target.value })} className={INPUT_CLASS} /></InspectorField>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
