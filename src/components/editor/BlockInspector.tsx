'use client'

import { useState, useEffect } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBlock = any

interface BlockInspectorProps {
  block: AnyBlock | null
  onUpdateBlock: (blockId: string, updated: AnyBlock) => void
  onDeleteBlock: (blockId: string) => void
}

const BLOCK_TYPE_NAMES: Record<string, string> = {
  video: 'Video',
  culture_note: 'Culture Note',
  sentence: 'Sentence',
  dialogue: 'Dialogue',
  reading: 'Reading',
  flashcard: 'Flashcard',
  matching: 'Matching',
  image_quiz: 'Image Quiz',
  fill_blank: 'Fill in Blank',
  word_bank: 'Word Bank',
  sort_sentence: 'Sort Sentence',
  translation: 'Translation',
  quiz: 'Quiz',
  true_false: 'True / False',
  listening: 'Listening',
  shadowing: 'Shadowing',
  speaking: 'Speaking',
  typing_jp: 'Type Japanese',
}

/* ── Shared field component ── */

function FieldLabel({ label }: { label: string }) {
  return <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="mb-3">
      <FieldLabel label={label} />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div className="mb-3">
      <FieldLabel label={label} />
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors resize-none"
      />
    </div>
  )
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="mb-3">
      <FieldLabel label={label} />
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  )
}

/* ── Block-specific config components ── */

function VideoConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  return (
    <>
      <TextInput label="Title" value={block.title} onChange={(v) => onChange({ ...block, title: v })} placeholder="Video title" />
      <TextInput label="Video URL" value={block.videoUrl} onChange={(v) => onChange({ ...block, videoUrl: v })} placeholder="https://youtube.com/..." />
    </>
  )
}

function CultureNoteConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  return (
    <>
      <TextInput label="Title" value={block.title} onChange={(v) => onChange({ ...block, title: v })} placeholder="Culture note title" />
      <TextArea label="Content" value={block.content} onChange={(v) => onChange({ ...block, content: v })} placeholder="Write about the cultural context..." rows={5} />
      <TextInput label="Image URL" value={block.image} onChange={(v) => onChange({ ...block, image: v })} placeholder="https://..." />
    </>
  )
}

function SentenceConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  return (
    <>
      <TextInput label="Japanese" value={block.japanese} onChange={(v) => onChange({ ...block, japanese: v })} placeholder="日本語" />
      <TextInput label="Furigana" value={block.furigana} onChange={(v) => onChange({ ...block, furigana: v })} placeholder="にほんご" />
      <TextInput label="English" value={block.english} onChange={(v) => onChange({ ...block, english: v })} placeholder="English translation" />
    </>
  )
}

function FlashcardConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  return (
    <>
      <TextInput label="Front" value={block.front} onChange={(v) => onChange({ ...block, front: v })} placeholder="Front of card" />
      <TextInput label="Back" value={block.back} onChange={(v) => onChange({ ...block, back: v })} placeholder="Back of card" />
      <TextInput label="Hint" value={block.hint} onChange={(v) => onChange({ ...block, hint: v })} placeholder="Optional hint" />
    </>
  )
}

function FillBlankConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  return (
    <>
      <TextArea label="Sentence (use ___ for blank)" value={block.sentence} onChange={(v) => onChange({ ...block, sentence: v })} placeholder="私は___が好きです。" />
      <TextInput label="Correct Answer" value={block.blank} onChange={(v) => onChange({ ...block, blank: v })} placeholder="寿司" />
      <TextArea
        label="Options (one per line)"
        value={(block.options || []).join('\n')}
        onChange={(v) => onChange({ ...block, options: v.split('\n').filter(Boolean) })}
        placeholder="寿司\nラーメン\nカレー"
      />
    </>
  )
}

function QuizConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  const options = block.options || ['', '', '', '']
  return (
    <>
      <TextArea label="Question" value={block.question} onChange={(v) => onChange({ ...block, question: v })} placeholder="Ask a question..." />
      {options.map((opt: string, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-2">
          <button
            onClick={() => onChange({ ...block, correctIndex: i })}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              block.correctIndex === i
                ? 'border-green-500 bg-green-500/20 text-green-400'
                : 'border-white/20 text-transparent hover:border-white/40'
            }`}
          >
            <span className="text-xs">✓</span>
          </button>
          <input
            type="text"
            value={opt}
            onChange={(e) => {
              const newOptions = [...options]
              newOptions[i] = e.target.value
              onChange({ ...block, options: newOptions })
            }}
            placeholder={`Option ${i + 1}`}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500"
          />
        </div>
      ))}
    </>
  )
}

function TrueFalseConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  return (
    <>
      <TextArea label="Statement" value={block.statement} onChange={(v) => onChange({ ...block, statement: v })} placeholder="Write a statement..." />
      <div className="mb-3">
        <FieldLabel label="Correct Answer" />
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ ...block, answer: true })}
            className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${
              block.answer ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 bg-white/5 text-gray-400'
            }`}
          >
            True
          </button>
          <button
            onClick={() => onChange({ ...block, answer: false })}
            className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${
              !block.answer ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-white/10 bg-white/5 text-gray-400'
            }`}
          >
            False
          </button>
        </div>
      </div>
    </>
  )
}

function TranslationConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  return (
    <>
      <div className="mb-3">
        <FieldLabel label="Direction" />
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ ...block, direction: 'en_to_jp' })}
            className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
              block.direction === 'en_to_jp' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/10 bg-white/5 text-gray-400'
            }`}
          >
            EN → JP
          </button>
          <button
            onClick={() => onChange({ ...block, direction: 'jp_to_en' })}
            className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
              block.direction === 'jp_to_en' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/10 bg-white/5 text-gray-400'
            }`}
          >
            JP → EN
          </button>
        </div>
      </div>
      <TextArea label="Source" value={block.source} onChange={(v) => onChange({ ...block, source: v })} placeholder="Source text" />
      <TextArea label="Target" value={block.target} onChange={(v) => onChange({ ...block, target: v })} placeholder="Target translation" />
    </>
  )
}

function ShadowingConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  return (
    <>
      <TextInput label="Audio URL" value={block.audioUrl} onChange={(v) => onChange({ ...block, audioUrl: v })} placeholder="https://..." />
      <TextArea label="Text" value={block.text} onChange={(v) => onChange({ ...block, text: v })} placeholder="Japanese text to shadow" />
    </>
  )
}

function SpeakingConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  return (
    <>
      <TextArea label="Prompt" value={block.prompt} onChange={(v) => onChange({ ...block, prompt: v })} placeholder="What should the student say?" />
      <TextInput label="Expected Text" value={block.expectedText} onChange={(v) => onChange({ ...block, expectedText: v })} placeholder="Expected answer in Japanese" />
    </>
  )
}

function TypingJpConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  return (
    <>
      <TextArea label="Prompt" value={block.prompt} onChange={(v) => onChange({ ...block, prompt: v })} placeholder="What should they type?" />
      <TextInput label="Answer" value={block.answer} onChange={(v) => onChange({ ...block, answer: v })} placeholder="Correct answer in Japanese" />
      <div className="mb-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={block.acceptFurigana ?? true}
            onChange={(e) => onChange({ ...block, acceptFurigana: e.target.checked })}
            className="rounded border-white/20 bg-white/5"
          />
          <span className="text-xs text-gray-400">Accept furigana</span>
        </label>
      </div>
    </>
  )
}

function ListeningConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  return (
    <>
      <TextInput label="Audio URL" value={block.audioUrl} onChange={(v) => onChange({ ...block, audioUrl: v })} placeholder="https://..." />
      <TextArea label="Question" value={block.question} onChange={(v) => onChange({ ...block, question: v })} placeholder="What did you hear?" />
      <TextArea
        label="Options (one per line)"
        value={(block.options || []).join('\n')}
        onChange={(v) => onChange({ ...block, options: v.split('\n').filter(Boolean) })}
        placeholder="Option 1\nOption 2\nOption 3"
      />
      <NumberInput label="Correct Option Index (0-based)" value={block.correctIndex ?? 0} onChange={(v) => onChange({ ...block, correctIndex: v })} min={0} />
    </>
  )
}

function GenericBlockConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  const [json, setJson] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const { id, type, order, xp, ...rest } = block
    void id; void type; void order; void xp;
    setJson(JSON.stringify(rest, null, 2))
  }, [block])

  const handleApply = () => {
    try {
      const parsed = JSON.parse(json)
      onChange({ ...block, ...parsed })
      setError('')
    } catch {
      setError('Invalid JSON')
    }
  }

  return (
    <div className="mb-3">
      <FieldLabel label="Block Data (JSON)" />
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={10}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-blue-500 transition-colors resize-none"
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      <button
        onClick={handleApply}
        className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded-lg transition-colors"
      >
        Apply JSON
      </button>
    </div>
  )
}

/* ── Config router ── */

function BlockConfig({ block, onChange }: { block: AnyBlock; onChange: (b: AnyBlock) => void }) {
  switch (block.type) {
    case 'video':
      return <VideoConfig block={block} onChange={onChange} />
    case 'culture_note':
      return <CultureNoteConfig block={block} onChange={onChange} />
    case 'sentence':
      return <SentenceConfig block={block} onChange={onChange} />
    case 'flashcard':
      return <FlashcardConfig block={block} onChange={onChange} />
    case 'fill_blank':
      return <FillBlankConfig block={block} onChange={onChange} />
    case 'quiz':
      return <QuizConfig block={block} onChange={onChange} />
    case 'true_false':
      return <TrueFalseConfig block={block} onChange={onChange} />
    case 'translation':
      return <TranslationConfig block={block} onChange={onChange} />
    case 'shadowing':
      return <ShadowingConfig block={block} onChange={onChange} />
    case 'speaking':
      return <SpeakingConfig block={block} onChange={onChange} />
    case 'typing_jp':
      return <TypingJpConfig block={block} onChange={onChange} />
    case 'listening':
      return <ListeningConfig block={block} onChange={onChange} />
    default:
      return <GenericBlockConfig block={block} onChange={onChange} />
  }
}

/* ── Main Inspector ── */

export default function BlockInspector({ block, onUpdateBlock, onDeleteBlock }: BlockInspectorProps) {
  if (!block) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-3xl mb-2 opacity-20">🖱️</div>
          <p className="text-gray-500 text-sm">Click a block to edit it</p>
        </div>
      </div>
    )
  }

  const typeName = BLOCK_TYPE_NAMES[block.type] || block.type

  const handleChange = (updated: AnyBlock) => {
    onUpdateBlock(block.id, updated)
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">{typeName}</h3>
        <button
          onClick={() => onDeleteBlock(block.id)}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      </div>

      <div className="w-full h-px bg-white/10 mb-4" />

      {/* XP field */}
      <NumberInput
        label="XP Reward"
        value={block.xp ?? 0}
        onChange={(v) => handleChange({ ...block, xp: v })}
        min={0}
        max={100}
      />

      <div className="w-full h-px bg-white/10 mb-4" />

      {/* Block-specific config */}
      <BlockConfig block={block} onChange={handleChange} />
    </div>
  )
}
