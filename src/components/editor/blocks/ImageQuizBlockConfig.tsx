'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ImageQuizBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const addItem = () => {
    const items = [...(block.items || []), { imageUrl: '', question: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }]
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

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Items ({block.items?.length || 0})</p>
        <button onClick={addItem} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(block.items || []).map((item: any, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] overflow-hidden">
          <button className="w-full flex items-center justify-between p-3" onClick={() => setExpanded(expanded === i ? null : i)}>
            <span className="text-white text-sm font-bold truncate max-w-[200px]">{item.question || `Item ${i + 1}`}</span>
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); deleteItem(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{expanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 mt-0">
              <div className="mt-2">
                <InspectorField label="Image URL"><input value={item.imageUrl || ''} onChange={e => updateItem(i, { ...item, imageUrl: e.target.value })} placeholder="https://..." className={INPUT_CLASS} /></InspectorField>
              </div>
              {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-24 object-cover rounded-[10px]" />}
              <InspectorField label="Question"><input value={item.question || ''} onChange={e => updateItem(i, { ...item, question: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Options</p>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(item.options || []).map((opt: any, oi: number) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const options = item.options.map((o: { text: string; isCorrect: boolean }, idx: number) => ({ ...o, isCorrect: idx === oi }))
                      updateItem(i, { ...item, options })
                    }}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${opt.isCorrect ? 'border-green-400 bg-green-400/20' : 'border-white/20'}`}
                  >
                    {opt.isCorrect && <span className="text-green-400 text-xs">✓</span>}
                  </button>
                  <input value={opt.text || ''} onChange={e => {
                    const options = [...item.options]
                    options[oi] = { ...options[oi], text: e.target.value }
                    updateItem(i, { ...item, options })
                  }} className={INPUT_CLASS} />
                  <button onClick={() => updateItem(i, { ...item, options: item.options.filter((_: unknown, idx: number) => idx !== oi) })} className="text-red-400/60 hover:text-red-400 text-xs shrink-0">✕</button>
                </div>
              ))}
              <button onClick={() => updateItem(i, { ...item, options: [...(item.options || []), { text: '', isCorrect: false }] })} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add option</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
