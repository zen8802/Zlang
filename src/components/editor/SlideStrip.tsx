'use client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySlide = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBlock = any

const BLOCK_TYPE_ICONS: Record<string, string> = {
  video: '🎬',
  culture_note: '🏯',
  sentence: '📝',
  dialogue: '💬',
  reading: '📖',
  flashcard: '🃏',
  matching: '🔗',
  image_quiz: '🖼️',
  fill_blank: '✏️',
  word_bank: '🏦',
  sort_sentence: '🔀',
  translation: '🌐',
  quiz: '❓',
  true_false: '✅',
  listening: '🎧',
  shadowing: '🗣️',
  speaking: '🎙️',
  typing_jp: '⌨️',
}

interface SlideStripProps {
  slides: AnySlide[]
  activeIndex: number
  onSelectSlide: (index: number) => void
  onAddSlide: () => void
  onDeleteSlide: (index: number) => void
}

export default function SlideStrip({
  slides,
  activeIndex,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
}: SlideStripProps) {
  return (
    <div className="flex items-center gap-2 p-3 overflow-x-auto">
      {slides.map((slide: AnySlide, index: number) => (
        <div
          key={slide.id || index}
          className="relative group shrink-0"
        >
          <button
            onClick={() => onSelectSlide(index)}
            className={`w-28 h-16 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
              index === activeIndex
                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-[10px] font-semibold text-gray-300">
              {index + 1}
            </span>
            <div className="flex gap-0.5">
              {(slide.blocks || []).slice(0, 5).map((block: AnyBlock, bi: number) => (
                <span key={bi} className="text-[8px]">
                  {BLOCK_TYPE_ICONS[block.type] || '📦'}
                </span>
              ))}
              {(slide.blocks || []).length > 5 && (
                <span className="text-[8px] text-gray-500">+{slide.blocks.length - 5}</span>
              )}
              {(slide.blocks || []).length === 0 && (
                <span className="text-[8px] text-gray-500">empty</span>
              )}
            </div>
          </button>

          {/* Delete button on hover */}
          {slides.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteSlide(index) }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {/* Add slide button */}
      <button
        onClick={onAddSlide}
        className="w-28 h-16 rounded-lg border-2 border-dashed border-white/10 hover:border-white/20 flex items-center justify-center transition-colors shrink-0"
      >
        <span className="text-xl text-gray-500">+</span>
      </button>
    </div>
  )
}
