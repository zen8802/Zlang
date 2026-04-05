'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS, TEXTAREA_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TypingJPBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const addItem = () => {
    const items = [...(block.items || []), { prompt: '', answer: '', hint: '' }]
    onChange({ ...block, items })
    setExpanded(items.length - 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateItem = (i: number, item: any) => {
    const items = [...(block.items || [])]
    items[i] = item
    onChange({ ...block, items })
  }

  const deleteItem = (i: number) => {
    onChange({ ...block, items: block.items.filter((_: unknown, idx: number) => idx !== i) })
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
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Items ({block.items?.length || 0})</p>
        <button onClick={addItem} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(block.items || []).map((item: any, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] overflow-hidden">
          <button className="w-full flex items-center justify-between p-3" onClick={() => setExpanded(expanded === i ? null : i)}>
            <span className="text-white text-sm font-bold truncate max-w-[200px]">{item.prompt || `Item ${i + 1}`}</span>
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); deleteItem(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{expanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 mt-0">
              <div className="mt-2">
                <InspectorField label="Prompt (English)"><input value={item.prompt || ''} onChange={e => updateItem(i, { ...item, prompt: e.target.value })} placeholder="Type this in Japanese..." className={INPUT_CLASS} /></InspectorField>
              </div>
              <InspectorField label="Answer (Japanese)"><input value={item.answer || ''} onChange={e => updateItem(i, { ...item, answer: e.target.value })} className={INPUT_CLASS} style={{ fontFamily: 'Noto Sans JP' }} /></InspectorField>
              <InspectorField label="Hint"><input value={item.hint || ''} onChange={e => updateItem(i, { ...item, hint: e.target.value })} className={INPUT_CLASS} /></InspectorField>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
