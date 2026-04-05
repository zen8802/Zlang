'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ListeningBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const addItem = () => {
    const items = [...(block.items || []), { audioText: '', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }], correctOptionId: 'a' }]
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateOption = (ii: number, oi: number, text: string, item: any) => {
    const options = [...(item.options || [])]
    options[oi] = { ...options[oi], text }
    updateItem(ii, { ...item, options })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addOption = (ii: number, item: any) => {
    const id = String.fromCharCode(97 + (item.options || []).length)
    updateItem(ii, { ...item, options: [...(item.options || []), { id, text: '' }] })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deleteOption = (ii: number, oi: number, item: any) => {
    const options = item.options.filter((_: unknown, idx: number) => idx !== oi)
    updateItem(ii, { ...item, options })
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
            <span className="text-white text-sm font-bold truncate max-w-[200px]">{item.audioText || `Item ${i + 1}`}</span>
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); deleteItem(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{expanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 mt-0">
              <div className="mt-2">
                <InspectorField label="Audio text (what is spoken)">
                  <input value={item.audioText || ''} onChange={e => updateItem(i, { ...item, audioText: e.target.value })} className={INPUT_CLASS} style={{ fontFamily: 'Noto Sans JP' }} />
                </InspectorField>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Options</p>
                <button onClick={() => addOption(i, item)} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
              </div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(item.options || []).map((opt: any, oi: number) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    onClick={() => updateItem(i, { ...item, correctOptionId: opt.id })}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${item.correctOptionId === opt.id ? 'border-green-400 bg-green-400/20' : 'border-white/20'}`}
                  >
                    {item.correctOptionId === opt.id && <span className="text-green-400 text-xs">✓</span>}
                  </button>
                  <span className="text-xs text-gray-500 shrink-0">{opt.id}.</span>
                  <input value={opt.text || ''} onChange={e => updateOption(i, oi, e.target.value, item)} className={INPUT_CLASS} />
                  <button onClick={() => deleteOption(i, oi, item)} className="text-red-400/60 hover:text-red-400 text-xs shrink-0">✕</button>
                </div>
              ))}
              <InspectorField label="Correct option ID">
                <input value={item.correctOptionId || ''} onChange={e => updateItem(i, { ...item, correctOptionId: e.target.value })} className={INPUT_CLASS} />
              </InspectorField>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
