'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS, TEXTAREA_CLASS } from './shared'

interface QuizOption {
  text: string
  isCorrect: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function QuizBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const addQuestion = () => {
    const questions = [...(block.questions || []), {
      type: 'multiple_choice',
      question: '',
      questionJP: '',
      options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
      explanation: ''
    }]
    onChange({ ...block, questions })
    setExpanded(questions.length - 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateQuestion = (i: number, q: any) => {
    const questions = [...(block.questions || [])]
    questions[i] = q
    onChange({ ...block, questions })
  }

  const deleteQuestion = (i: number) => {
    onChange({ ...block, questions: block.questions.filter((_: unknown, idx: number) => idx !== i) })
    setExpanded(null)
  }

  const updateOption = (qi: number, oi: number, opt: QuizOption) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = { ...(block.questions || [])[qi] } as any
    const options = [...(q.options || [])]
    options[oi] = opt
    q.options = options
    updateQuestion(qi, q)
  }

  const addOption = (qi: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = { ...(block.questions || [])[qi] } as any
    q.options = [...(q.options || []), { text: '', isCorrect: false }]
    updateQuestion(qi, q)
  }

  const deleteOption = (qi: number, oi: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = { ...(block.questions || [])[qi] } as any
    q.options = q.options.filter((_: unknown, idx: number) => idx !== oi)
    updateQuestion(qi, q)
  }

  return (
    <div className="space-y-3">
      <InspectorField label="Title">
        <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })} className={INPUT_CLASS} />
      </InspectorField>
      <InspectorField label="Instruction">
        <textarea value={block.instruction || ''} onChange={e => onChange({ ...block, instruction: e.target.value })} rows={2} className={TEXTAREA_CLASS} />
      </InspectorField>
      <InspectorField label="Passing score (%)">
        <input type="number" value={block.passingScore || 70} onChange={e => onChange({ ...block, passingScore: parseInt(e.target.value) || 70 })} className={INPUT_CLASS} />
      </InspectorField>

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Questions ({block.questions?.length || 0})</p>
        <button onClick={addQuestion} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(block.questions || []).map((q: any, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] overflow-hidden">
          <button className="w-full flex items-center justify-between p-3" onClick={() => setExpanded(expanded === i ? null : i)}>
            <span className="text-white text-sm font-bold truncate max-w-[200px]">{q.question || `Question ${i + 1}`}</span>
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); deleteQuestion(i) }} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              <span className="text-gray-600 text-xs">{expanded === i ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === i && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/5 mt-0">
              <div className="mt-2">
                <InspectorField label="Question (EN)">
                  <input value={q.question || ''} onChange={e => updateQuestion(i, { ...q, question: e.target.value })} className={INPUT_CLASS} />
                </InspectorField>
              </div>
              <InspectorField label="Question (JP)">
                <input value={q.questionJP || ''} onChange={e => updateQuestion(i, { ...q, questionJP: e.target.value })} className={INPUT_CLASS} style={{ fontFamily: 'Noto Sans JP' }} />
              </InspectorField>

              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Options</p>
                <button onClick={() => addOption(i)} className="text-xs text-[#1B4F8A] font-bold hover:underline">+ Add</button>
              </div>
              {(q.options || []).map((opt: QuizOption, oi: number) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    onClick={() => updateOption(i, oi, { ...opt, isCorrect: !opt.isCorrect })}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${opt.isCorrect ? 'border-green-400 bg-green-400/20' : 'border-white/20'}`}
                  >
                    {opt.isCorrect && <span className="text-green-400 text-xs">✓</span>}
                  </button>
                  <input value={opt.text || ''} onChange={e => updateOption(i, oi, { ...opt, text: e.target.value })} placeholder={`Option ${oi + 1}`} className={INPUT_CLASS} />
                  <button onClick={() => deleteOption(i, oi)} className="text-red-400/60 hover:text-red-400 text-xs shrink-0">✕</button>
                </div>
              ))}

              <InspectorField label="Explanation">
                <textarea value={q.explanation || ''} onChange={e => updateQuestion(i, { ...q, explanation: e.target.value })} rows={2} className={TEXTAREA_CLASS} />
              </InspectorField>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
