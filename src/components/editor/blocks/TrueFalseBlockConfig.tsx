'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS, TEXTAREA_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TrueFalseBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const addStatement = () => {
    const statements = [...(block.statements || []), { statement: '', isTrue: true, explanation: '' }]
    onChange({ ...block, statements })
    setExpanded(statements.length - 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateStatement = (i: number, s: any) => {
    const statements = [...(block.statements || [])]
    statements[i] = s
    onChange({ ...block, statements })
  }

  const deleteStatement = (i: number) => {
    onChange({ ...block, statements: block.statements.filter((_: unknown, idx: number) => idx !== i) })
    setExpanded(null)
  }

  return (
    <div className="space-y-3">
      <InspectorField label="Title">
        <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })} className={INPUT_CLASS} />
      </InspectorField>

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Statements ({block.statements?.length || 0})</p>
        <button onClick={addStatement} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(block.statements || []).map((s: any, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] overflow-hidden">
          <button className="w-full flex items-center justify-between p-3" onClick={() => setExpanded(expanded === i ? null : i)}>
            <span className="text-white text-sm font-bold truncate max-w-[180px]">{s.statement || `Statement ${i + 1}`}</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${s.isTrue ? 'text-green-400' : 'text-red-400'}`}>{s.isTrue ? 'TRUE' : 'FALSE'}</span>
              <button onClick={e => { e.stopPropagation(); deleteStatement(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{expanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 mt-0">
              <div className="mt-2">
                <InspectorField label="Statement"><input value={s.statement || ''} onChange={e => updateStatement(i, { ...s, statement: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              </div>
              <InspectorField label="Is True">
                <button
                  onClick={() => updateStatement(i, { ...s, isTrue: !s.isTrue })}
                  className={`px-4 py-2 rounded-[10px] text-sm font-bold transition-colors ${s.isTrue ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                >
                  {s.isTrue ? 'TRUE' : 'FALSE'}
                </button>
              </InspectorField>
              <InspectorField label="Explanation"><textarea value={s.explanation || ''} onChange={e => updateStatement(i, { ...s, explanation: e.target.value })} rows={2} className={TEXTAREA_CLASS} /></InspectorField>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
