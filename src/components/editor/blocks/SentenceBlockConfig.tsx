'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS, TEXTAREA_CLASS, SELECT_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SentenceBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [kwExpanded, setKwExpanded] = useState<Record<string, boolean>>({})

  const addSentence = () => {
    const sentences = [...(block.sentences || []), {
      japanese: '', romaji: '', english: '', emotionTag: '',
      keywords: [],
      grammarNote: { pattern: '', explanation: '', jlptLevel: 'N5' }
    }]
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addKeyword = (si: number, s: any) => {
    const keywords = [...(s.keywords || []), { word: '', reading: '', romaji: '', meaning: '', jlptLevel: 'N5', partOfSpeech: 'noun' }]
    updateSentence(si, { ...s, keywords })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateKeyword = (si: number, ki: number, kw: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = { ...(block.sentences || [])[si] } as any
    const keywords = [...(s.keywords || [])]
    keywords[ki] = kw
    updateSentence(si, { ...s, keywords })
  }

  const deleteKeyword = (si: number, ki: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = { ...(block.sentences || [])[si] } as any
    s.keywords = s.keywords.filter((_: unknown, idx: number) => idx !== ki)
    updateSentence(si, s)
  }

  return (
    <div className="space-y-3">
      <InspectorField label="Title">
        <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })} className={INPUT_CLASS} />
      </InspectorField>

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sentences ({block.sentences?.length || 0})</p>
        <button onClick={addSentence} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(block.sentences || []).map((s: any, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] overflow-hidden">
          <button className="w-full flex items-center justify-between p-3" onClick={() => setExpanded(expanded === i ? null : i)}>
            <span className="text-white text-sm font-bold truncate max-w-[200px]" style={{ fontFamily: 'Noto Sans JP' }}>{s.japanese || `Sentence ${i + 1}`}</span>
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); deleteSentence(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{expanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 mt-0">
              <div className="mt-2">
                <InspectorField label="Japanese"><input value={s.japanese || ''} onChange={e => updateSentence(i, { ...s, japanese: e.target.value })} className={INPUT_CLASS} style={{ fontFamily: 'Noto Sans JP' }} /></InspectorField>
              </div>
              <InspectorField label="Romaji"><input value={s.romaji || ''} onChange={e => updateSentence(i, { ...s, romaji: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              <InspectorField label="English"><input value={s.english || ''} onChange={e => updateSentence(i, { ...s, english: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              <InspectorField label="Emotion tag"><input value={s.emotionTag || ''} onChange={e => updateSentence(i, { ...s, emotionTag: e.target.value })} placeholder="e.g. excited, polite, casual" className={INPUT_CLASS} /></InspectorField>

              {/* Grammar Note */}
              <div className="bg-white/5 rounded-[10px] p-2 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Grammar Note</p>
                <InspectorField label="Pattern"><input value={s.grammarNote?.pattern || ''} onChange={e => updateSentence(i, { ...s, grammarNote: { ...s.grammarNote, pattern: e.target.value } })} className={INPUT_CLASS} /></InspectorField>
                <InspectorField label="Explanation"><textarea value={s.grammarNote?.explanation || ''} onChange={e => updateSentence(i, { ...s, grammarNote: { ...s.grammarNote, explanation: e.target.value } })} rows={2} className={TEXTAREA_CLASS} /></InspectorField>
                <InspectorField label="JLPT"><select value={s.grammarNote?.jlptLevel || 'N5'} onChange={e => updateSentence(i, { ...s, grammarNote: { ...s.grammarNote, jlptLevel: e.target.value } })} className={SELECT_CLASS}>{['N5','N4','N3','N2','N1'].map(l => <option key={l}>{l}</option>)}</select></InspectorField>
              </div>

              {/* Keywords */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Keywords ({s.keywords?.length || 0})</p>
                <button onClick={() => addKeyword(i, s)} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
              </div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(s.keywords || []).map((kw: any, ki: number) => {
                const kwKey = `${i}-${ki}`
                return (
                  <div key={ki} className="bg-white/5 rounded-[10px] overflow-hidden">
                    <button className="w-full flex items-center justify-between p-2" onClick={() => setKwExpanded(prev => ({ ...prev, [kwKey]: !prev[kwKey] }))}>
                      <span className="text-white text-xs font-bold" style={{ fontFamily: 'Noto Sans JP' }}>{kw.word || 'New keyword'}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={e => { e.stopPropagation(); deleteKeyword(i, ki) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
                        <span className="text-gray-600 text-xs">{kwExpanded[kwKey] ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {kwExpanded[kwKey] && (
                      <div className="px-2 pb-2 space-y-1 border-t border-white/5">
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          <InspectorField label="Word"><input value={kw.word || ''} onChange={e => updateKeyword(i, ki, { ...kw, word: e.target.value })} className={INPUT_CLASS} style={{ fontFamily: 'Noto Sans JP' }} /></InspectorField>
                          <InspectorField label="Reading"><input value={kw.reading || ''} onChange={e => updateKeyword(i, ki, { ...kw, reading: e.target.value })} className={INPUT_CLASS} /></InspectorField>
                          <InspectorField label="Romaji"><input value={kw.romaji || ''} onChange={e => updateKeyword(i, ki, { ...kw, romaji: e.target.value })} className={INPUT_CLASS} /></InspectorField>
                          <InspectorField label="Meaning"><input value={kw.meaning || ''} onChange={e => updateKeyword(i, ki, { ...kw, meaning: e.target.value })} className={INPUT_CLASS} /></InspectorField>
                          <InspectorField label="JLPT"><select value={kw.jlptLevel || 'N5'} onChange={e => updateKeyword(i, ki, { ...kw, jlptLevel: e.target.value })} className={SELECT_CLASS}>{['N5','N4','N3','N2','N1'].map(l => <option key={l}>{l}</option>)}</select></InspectorField>
                          <InspectorField label="Part of speech"><select value={kw.partOfSpeech || 'noun'} onChange={e => updateKeyword(i, ki, { ...kw, partOfSpeech: e.target.value })} className={SELECT_CLASS}>{['noun','verb','adjective','adverb','particle','phrase','counter'].map(p => <option key={p}>{p}</option>)}</select></InspectorField>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
