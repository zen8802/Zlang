'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS, TEXTAREA_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ReadingBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [passageExpanded, setPassageExpanded] = useState<number | null>(null)
  const [questionExpanded, setQuestionExpanded] = useState<number | null>(null)

  const addPassage = () => {
    const passages = [...(block.passages || []), { japanese: '', english: '' }]
    onChange({ ...block, passages })
    setPassageExpanded(passages.length - 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePassage = (i: number, p: any) => {
    const passages = [...(block.passages || [])]
    passages[i] = p
    onChange({ ...block, passages })
  }

  const deletePassage = (i: number) => {
    onChange({ ...block, passages: block.passages.filter((_: unknown, idx: number) => idx !== i) })
    setPassageExpanded(null)
  }

  const addQuestion = () => {
    const questions = [...(block.questions || []), { question: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }], explanation: '' }]
    onChange({ ...block, questions })
    setQuestionExpanded(questions.length - 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateQuestion = (i: number, q: any) => {
    const questions = [...(block.questions || [])]
    questions[i] = q
    onChange({ ...block, questions })
  }

  const deleteQuestion = (i: number) => {
    onChange({ ...block, questions: block.questions.filter((_: unknown, idx: number) => idx !== i) })
    setQuestionExpanded(null)
  }

  return (
    <div className="space-y-3">
      <InspectorField label="Title">
        <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })} className={INPUT_CLASS} />
      </InspectorField>
      <InspectorField label="Context">
        <textarea value={block.context || ''} onChange={e => onChange({ ...block, context: e.target.value })} rows={2} className={TEXTAREA_CLASS} />
      </InspectorField>

      {/* Passages */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Passages ({block.passages?.length || 0})</p>
        <button onClick={addPassage} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(block.passages || []).map((p: any, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] overflow-hidden">
          <button className="w-full flex items-center justify-between p-3" onClick={() => setPassageExpanded(passageExpanded === i ? null : i)}>
            <span className="text-white text-sm font-bold truncate max-w-[200px]" style={{ fontFamily: 'Noto Sans JP' }}>{p.japanese?.substring(0, 30) || `Passage ${i + 1}`}</span>
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); deletePassage(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{passageExpanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {passageExpanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 mt-0">
              <div className="mt-2">
                <InspectorField label="Japanese"><textarea value={p.japanese || ''} onChange={e => updatePassage(i, { ...p, japanese: e.target.value })} rows={3} className={TEXTAREA_CLASS} style={{ fontFamily: 'Noto Sans JP' }} /></InspectorField>
              </div>
              <InspectorField label="English"><textarea value={p.english || ''} onChange={e => updatePassage(i, { ...p, english: e.target.value })} rows={3} className={TEXTAREA_CLASS} /></InspectorField>
            </div>
          )}
        </div>
      ))}

      {/* Comprehension Questions */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Questions ({block.questions?.length || 0})</p>
        <button onClick={addQuestion} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(block.questions || []).map((q: any, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] overflow-hidden">
          <button className="w-full flex items-center justify-between p-3" onClick={() => setQuestionExpanded(questionExpanded === i ? null : i)}>
            <span className="text-white text-sm font-bold truncate max-w-[200px]">{q.question || `Question ${i + 1}`}</span>
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); deleteQuestion(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{questionExpanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {questionExpanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 mt-0">
              <div className="mt-2">
                <InspectorField label="Question"><input value={q.question || ''} onChange={e => updateQuestion(i, { ...q, question: e.target.value })} className={INPUT_CLASS} /></InspectorField>
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Options</p>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(q.options || []).map((opt: any, oi: number) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const options = q.options.map((o: { text: string; isCorrect: boolean }, idx: number) => ({ ...o, isCorrect: idx === oi }))
                      updateQuestion(i, { ...q, options })
                    }}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${opt.isCorrect ? 'border-green-400 bg-green-400/20' : 'border-white/20'}`}
                  >
                    {opt.isCorrect && <span className="text-green-400 text-xs">✓</span>}
                  </button>
                  <input value={opt.text || ''} onChange={e => {
                    const options = [...q.options]
                    options[oi] = { ...options[oi], text: e.target.value }
                    updateQuestion(i, { ...q, options })
                  }} className={INPUT_CLASS} />
                  <button onClick={() => {
                    updateQuestion(i, { ...q, options: q.options.filter((_: unknown, idx: number) => idx !== oi) })
                  }} className="text-red-400/60 hover:text-red-400 text-xs shrink-0">✕</button>
                </div>
              ))}
              <button onClick={() => updateQuestion(i, { ...q, options: [...(q.options || []), { text: '', isCorrect: false }] })} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add option</button>
              <InspectorField label="Explanation"><textarea value={q.explanation || ''} onChange={e => updateQuestion(i, { ...q, explanation: e.target.value })} rows={2} className={TEXTAREA_CLASS} /></InspectorField>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
