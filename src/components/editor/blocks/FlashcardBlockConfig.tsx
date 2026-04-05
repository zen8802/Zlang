'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS, SELECT_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FlashcardBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const addCard = () => {
    const cards = [...(block.cards || []), { word: '', reading: '', romaji: '', english: '', partOfSpeech: 'noun', jlptLevel: 'N5', exampleJP: '', exampleEN: '', memoryHook: '' }]
    onChange({ ...block, cards })
    setExpanded(cards.length - 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateCard = (i: number, card: any) => {
    const cards = [...(block.cards || [])]
    cards[i] = card
    onChange({ ...block, cards })
  }

  const deleteCard = (i: number) => {
    onChange({ ...block, cards: block.cards.filter((_: unknown, idx: number) => idx !== i) })
    setExpanded(null)
  }

  return (
    <div className="space-y-3">
      <InspectorField label="Title">
        <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })} className={INPUT_CLASS} />
      </InspectorField>

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cards ({block.cards?.length || 0})</p>
        <button onClick={addCard} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>

      {(block.cards || []).map((card: Record<string, string>, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] overflow-hidden">
          <button className="w-full flex items-center justify-between p-3" onClick={() => setExpanded(expanded === i ? null : i)}>
            <span className="text-white text-sm font-bold" style={{ fontFamily: 'Noto Sans JP' }}>{card.word || 'New card'}</span>
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); deleteCard(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{expanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5">
              <div className="grid grid-cols-2 gap-2 mt-2">
                <InspectorField label="Word"><input value={card.word || ''} onChange={e => updateCard(i, { ...card, word: e.target.value })} className={INPUT_CLASS} style={{ fontFamily: 'Noto Sans JP' }} /></InspectorField>
                <InspectorField label="Reading"><input value={card.reading || ''} onChange={e => updateCard(i, { ...card, reading: e.target.value })} className={INPUT_CLASS} /></InspectorField>
                <InspectorField label="Romaji"><input value={card.romaji || ''} onChange={e => updateCard(i, { ...card, romaji: e.target.value })} className={INPUT_CLASS} /></InspectorField>
                <InspectorField label="English"><input value={card.english || ''} onChange={e => updateCard(i, { ...card, english: e.target.value })} className={INPUT_CLASS} /></InspectorField>
                <InspectorField label="JLPT"><select value={card.jlptLevel || 'N5'} onChange={e => updateCard(i, { ...card, jlptLevel: e.target.value })} className={SELECT_CLASS}>{['N5','N4','N3','N2','N1'].map(l => <option key={l}>{l}</option>)}</select></InspectorField>
                <InspectorField label="Part of speech"><select value={card.partOfSpeech || 'noun'} onChange={e => updateCard(i, { ...card, partOfSpeech: e.target.value })} className={SELECT_CLASS}>{['noun','verb','adjective','adverb','particle','phrase','counter'].map(p => <option key={p}>{p}</option>)}</select></InspectorField>
              </div>
              <InspectorField label="Example JP"><input value={card.exampleJP || ''} onChange={e => updateCard(i, { ...card, exampleJP: e.target.value })} className={INPUT_CLASS} style={{ fontFamily: 'Noto Sans JP' }} /></InspectorField>
              <InspectorField label="Example EN"><input value={card.exampleEN || ''} onChange={e => updateCard(i, { ...card, exampleEN: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              <InspectorField label="Memory hook"><input value={card.memoryHook || ''} onChange={e => updateCard(i, { ...card, memoryHook: e.target.value })} placeholder="Mnemonic or association..." className={INPUT_CLASS} /></InspectorField>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
