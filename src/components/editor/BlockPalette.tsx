'use client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBlock = any

interface BlockPaletteProps {
  onAddBlock: (template: AnyBlock) => void
}

interface BlockTemplate {
  type: string
  icon: string
  label: string
  description: string
  defaults: Record<string, unknown>
}

interface BlockCategory {
  name: string
  color: string
  blocks: BlockTemplate[]
}

const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    name: 'Content',
    color: 'text-purple-400',
    blocks: [
      {
        type: 'video',
        icon: '🎬',
        label: 'Video',
        description: 'YouTube or uploaded video',
        defaults: { videoUrl: '', title: '', xp: 10 },
      },
      {
        type: 'culture_note',
        icon: '🏯',
        label: 'Culture Note',
        description: 'Cultural context card',
        defaults: { title: '', content: '', image: '', xp: 5 },
      },
      {
        type: 'sentence',
        icon: '📝',
        label: 'Sentence',
        description: 'Example sentence with breakdown',
        defaults: { japanese: '', english: '', furigana: '', xp: 5 },
      },
      {
        type: 'dialogue',
        icon: '💬',
        label: 'Dialogue',
        description: 'Conversation between characters',
        defaults: { lines: [], xp: 10 },
      },
      {
        type: 'reading',
        icon: '📖',
        label: 'Reading',
        description: 'Reading passage with comprehension',
        defaults: { text: '', questions: [], xp: 15 },
      },
    ],
  },
  {
    name: 'Vocabulary',
    color: 'text-green-400',
    blocks: [
      {
        type: 'flashcard',
        icon: '🃏',
        label: 'Flashcard',
        description: 'Flip card with front/back',
        defaults: { front: '', back: '', hint: '', xp: 5 },
      },
      {
        type: 'matching',
        icon: '🔗',
        label: 'Matching',
        description: 'Match pairs together',
        defaults: { pairs: [], xp: 10 },
      },
      {
        type: 'image_quiz',
        icon: '🖼️',
        label: 'Image Quiz',
        description: 'Identify image with vocabulary',
        defaults: { imageUrl: '', answer: '', options: [], xp: 10 },
      },
    ],
  },
  {
    name: 'Grammar',
    color: 'text-blue-400',
    blocks: [
      {
        type: 'fill_blank',
        icon: '✏️',
        label: 'Fill in Blank',
        description: 'Complete the sentence',
        defaults: { sentence: '', blank: '', options: [], xp: 10 },
      },
      {
        type: 'word_bank',
        icon: '🏦',
        label: 'Word Bank',
        description: 'Build sentence from word bank',
        defaults: { answer: [], distractors: [], xp: 10 },
      },
      {
        type: 'sort_sentence',
        icon: '🔀',
        label: 'Sort Sentence',
        description: 'Reorder words into correct sentence',
        defaults: { words: [], correctOrder: [], xp: 10 },
      },
      {
        type: 'translation',
        icon: '🌐',
        label: 'Translation',
        description: 'Translate between languages',
        defaults: { source: '', target: '', direction: 'en_to_jp', xp: 10 },
      },
    ],
  },
  {
    name: 'Quiz',
    color: 'text-yellow-400',
    blocks: [
      {
        type: 'quiz',
        icon: '❓',
        label: 'Quiz',
        description: 'Multiple choice question',
        defaults: { question: '', options: ['', '', '', ''], correctIndex: 0, xp: 10 },
      },
      {
        type: 'true_false',
        icon: '✅',
        label: 'True / False',
        description: 'True or false statement',
        defaults: { statement: '', answer: true, xp: 5 },
      },
      {
        type: 'listening',
        icon: '🎧',
        label: 'Listening',
        description: 'Listen and answer',
        defaults: { audioUrl: '', question: '', options: [], correctIndex: 0, xp: 15 },
      },
    ],
  },
  {
    name: 'Speaking',
    color: 'text-red-400',
    blocks: [
      {
        type: 'shadowing',
        icon: '🗣️',
        label: 'Shadowing',
        description: 'Listen and repeat aloud',
        defaults: { audioUrl: '', text: '', xp: 15 },
      },
      {
        type: 'speaking',
        icon: '🎙️',
        label: 'Speaking',
        description: 'Record and compare pronunciation',
        defaults: { prompt: '', expectedText: '', xp: 15 },
      },
      {
        type: 'typing_jp',
        icon: '⌨️',
        label: 'Type Japanese',
        description: 'Type answer in Japanese',
        defaults: { prompt: '', answer: '', acceptFurigana: true, xp: 10 },
      },
    ],
  },
]

export default function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  const handleAddBlock = (template: BlockTemplate) => {
    onAddBlock({
      type: template.type,
      ...template.defaults,
    })
  }

  return (
    <div className="p-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Blocks
      </h3>
      {BLOCK_CATEGORIES.map((category) => (
        <div key={category.name} className="mb-4">
          <h4 className={`text-xs font-semibold ${category.color} mb-2 px-1`}>
            {category.name}
          </h4>
          <div className="space-y-1">
            {category.blocks.map((block) => (
              <button
                key={block.type}
                onClick={() => handleAddBlock(block)}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{block.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-200 group-hover:text-white">
                      {block.label}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {block.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
