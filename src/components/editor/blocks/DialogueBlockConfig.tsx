'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DialogueBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const addLine = () => {
    const lines = [...(block.lines || []), { speaker: '', text: '', translation: '', isUser: false }]
    onChange({ ...block, lines })
    setExpanded(lines.length - 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateLine = (i: number, l: any) => {
    const lines = [...(block.lines || [])]
    lines[i] = l
    onChange({ ...block, lines })
  }

  const deleteLine = (i: number) => {
    onChange({ ...block, lines: block.lines.filter((_: unknown, idx: number) => idx !== i) })
    setExpanded(null)
  }

  return (
    <div className="space-y-3">
      <InspectorField label="Title">
        <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })} className={INPUT_CLASS} />
      </InspectorField>

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lines ({block.lines?.length || 0})</p>
        <button onClick={addLine} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(block.lines || []).map((l: any, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] overflow-hidden">
          <button className="w-full flex items-center justify-between p-3" onClick={() => setExpanded(expanded === i ? null : i)}>
            <span className="text-white text-sm font-bold truncate max-w-[180px]">{l.speaker || 'Speaker'}: {l.text || '...'}</span>
            <div className="flex items-center gap-2">
              {l.isUser && <span className="text-xs text-blue-400 font-bold">USER</span>}
              <button onClick={e => { e.stopPropagation(); deleteLine(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{expanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 mt-0">
              <div className="mt-2">
                <InspectorField label="Speaker"><input value={l.speaker || ''} onChange={e => updateLine(i, { ...l, speaker: e.target.value })} placeholder="Name..." className={INPUT_CLASS} /></InspectorField>
              </div>
              <InspectorField label="Text (JP)"><input value={l.text || ''} onChange={e => updateLine(i, { ...l, text: e.target.value })} className={INPUT_CLASS} style={{ fontFamily: 'Noto Sans JP' }} /></InspectorField>
              <InspectorField label="Translation"><input value={l.translation || ''} onChange={e => updateLine(i, { ...l, translation: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              <InspectorField label="Is user line">
                <button
                  onClick={() => updateLine(i, { ...l, isUser: !l.isUser })}
                  className={`px-4 py-2 rounded-[10px] text-sm font-bold transition-colors ${l.isUser ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}
                >
                  {l.isUser ? 'User' : 'NPC'}
                </button>
              </InspectorField>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
