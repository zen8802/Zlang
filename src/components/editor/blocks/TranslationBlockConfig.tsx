'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS, TEXTAREA_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TranslationBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const addItem = () => {
    const items = [...(block.items || []), { source: '', sourceLanguage: 'ja', acceptedAnswers: [], hint: '', explanation: '' }]
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
            <span className="text-white text-sm font-bold truncate max-w-[180px]">{item.source || `Item ${i + 1}`}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{item.sourceLanguage === 'ja' ? 'JP→EN' : 'EN→JP'}</span>
              <button onClick={e => { e.stopPropagation(); deleteItem(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{expanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 mt-0">
              <div className="mt-2">
                <InspectorField label="Source text"><input value={item.source || ''} onChange={e => updateItem(i, { ...item, source: e.target.value })} className={INPUT_CLASS} style={item.sourceLanguage === 'ja' ? { fontFamily: 'Noto Sans JP' } : {}} /></InspectorField>
              </div>
              <InspectorField label="Source language">
                <div className="flex gap-2">
                  <button onClick={() => updateItem(i, { ...item, sourceLanguage: 'ja' })} className={`px-3 py-1.5 rounded-[10px] text-xs font-bold ${item.sourceLanguage === 'ja' ? 'bg-[#1B4F8A]/30 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>Japanese</button>
                  <button onClick={() => updateItem(i, { ...item, sourceLanguage: 'en' })} className={`px-3 py-1.5 rounded-[10px] text-xs font-bold ${item.sourceLanguage === 'en' ? 'bg-[#1B4F8A]/30 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>English</button>
                </div>
              </InspectorField>
              <InspectorField label="Accepted answers (comma-separated)">
                <input
                  value={(item.acceptedAnswers || []).join(', ')}
                  onChange={e => updateItem(i, { ...item, acceptedAnswers: e.target.value.split(',').map((a: string) => a.trim()).filter(Boolean) })}
                  placeholder="answer1, answer2"
                  className={INPUT_CLASS}
                />
              </InspectorField>
              <InspectorField label="Hint"><input value={item.hint || ''} onChange={e => updateItem(i, { ...item, hint: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              <InspectorField label="Explanation"><textarea value={item.explanation || ''} onChange={e => updateItem(i, { ...item, explanation: e.target.value })} rows={2} className={TEXTAREA_CLASS} /></InspectorField>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
