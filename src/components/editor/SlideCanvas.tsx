'use client'

import { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBlock = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySlide = any

interface SlideCanvasProps {
  slide: AnySlide
  selectedBlockId: string | null
  onSelectBlock: (blockId: string | null) => void
  onReorderBlocks: (newBlocks: AnyBlock[]) => void
  onDeleteBlock: (blockId: string) => void
}

const BLOCK_TYPE_META: Record<string, { icon: string; color: string }> = {
  video: { icon: '🎬', color: 'border-purple-500/30' },
  culture_note: { icon: '🏯', color: 'border-purple-500/30' },
  sentence: { icon: '📝', color: 'border-purple-500/30' },
  dialogue: { icon: '💬', color: 'border-purple-500/30' },
  reading: { icon: '📖', color: 'border-purple-500/30' },
  flashcard: { icon: '🃏', color: 'border-green-500/30' },
  matching: { icon: '🔗', color: 'border-green-500/30' },
  image_quiz: { icon: '🖼️', color: 'border-green-500/30' },
  fill_blank: { icon: '✏️', color: 'border-blue-500/30' },
  word_bank: { icon: '🏦', color: 'border-blue-500/30' },
  sort_sentence: { icon: '🔀', color: 'border-blue-500/30' },
  translation: { icon: '🌐', color: 'border-blue-500/30' },
  quiz: { icon: '❓', color: 'border-yellow-500/30' },
  true_false: { icon: '✅', color: 'border-yellow-500/30' },
  listening: { icon: '🎧', color: 'border-yellow-500/30' },
  shadowing: { icon: '🗣️', color: 'border-red-500/30' },
  speaking: { icon: '🎙️', color: 'border-red-500/30' },
  typing_jp: { icon: '⌨️', color: 'border-red-500/30' },
}

function getBlockTitle(block: AnyBlock): string {
  return (
    block.title ||
    block.question ||
    block.japanese ||
    block.front ||
    block.sentence ||
    block.prompt ||
    block.statement ||
    block.text ||
    block.content ||
    `${block.type} block`
  )
}

function BlockTypePreview({ block }: { block: AnyBlock }) {
  switch (block.type) {
    case 'video':
      return (
        <div className="flex items-center justify-center h-16 bg-black/20 rounded mt-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white/60 text-sm ml-0.5">▶</span>
          </div>
          {block.videoUrl && (
            <span className="text-[10px] text-gray-500 ml-2 truncate max-w-[120px]">{block.videoUrl}</span>
          )}
        </div>
      )
    case 'flashcard':
      return (
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-10 bg-white/5 rounded border border-white/10 flex items-center justify-center">
              <span className="text-[10px] text-gray-500">{i === 0 ? (block.front || '表') : ''}</span>
            </div>
          ))}
        </div>
      )
    case 'quiz':
      return (
        <div className="grid grid-cols-2 gap-1 mt-2">
          {(block.options || ['A', 'B', 'C', 'D']).slice(0, 4).map((opt: string, i: number) => (
            <div
              key={i}
              className={`text-[10px] px-2 py-1 rounded border ${
                i === block.correctIndex
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-white/10 bg-white/5 text-gray-500'
              } truncate`}
            >
              {opt || `Option ${i + 1}`}
            </div>
          ))}
        </div>
      )
    case 'true_false':
      return (
        <div className="flex gap-2 mt-2">
          <div className={`flex-1 text-center text-xs py-1 rounded ${block.answer ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
            True
          </div>
          <div className={`flex-1 text-center text-xs py-1 rounded ${!block.answer ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
            False
          </div>
        </div>
      )
    case 'fill_blank':
      return (
        <div className="mt-2 text-xs text-gray-400">
          {block.sentence ? block.sentence.replace(block.blank || '___', '______') : 'Complete the ______'}
        </div>
      )
    case 'dialogue':
      return (
        <div className="mt-2 space-y-1">
          {(block.lines || []).slice(0, 2).map((line: { speaker?: string; text?: string }, i: number) => (
            <div key={i} className="text-[10px] text-gray-400">
              <span className="text-gray-500">{line.speaker || 'Speaker'}:</span> {line.text || '...'}
            </div>
          ))}
          {(!block.lines || block.lines.length === 0) && (
            <div className="text-[10px] text-gray-500 italic">No dialogue lines yet</div>
          )}
        </div>
      )
    default:
      return null
  }
}

interface BlockPreviewProps {
  block: AnyBlock
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

function BlockPreview({ block, isSelected, onSelect, onDelete }: BlockPreviewProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const meta = BLOCK_TYPE_META[block.type] || { icon: '📦', color: 'border-gray-500/30' }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`relative bg-[#1E1E3A] rounded-xl border-2 p-3 cursor-pointer transition-colors group ${
        isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/10' : `${meta.color} hover:border-white/20`
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          ⠿
        </button>

        <span className="text-base">{meta.icon}</span>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-200 truncate">
            {getBlockTitle(block)}
          </div>
          <div className="text-[10px] text-gray-500 capitalize">{block.type.replace(/_/g, ' ')}</div>
        </div>

        {/* XP Badge */}
        {block.xp && (
          <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">
            {block.xp} XP
          </span>
        )}

        {/* Delete button - visible on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all text-sm"
        >
          ✕
        </button>
      </div>

      {/* Type-specific preview */}
      <BlockTypePreview block={block} />
    </div>
  )
}

export default function SlideCanvas({
  slide,
  selectedBlockId,
  onSelectBlock,
  onReorderBlocks,
  onDeleteBlock,
}: SlideCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const blocks: AnyBlock[] = useMemo(() => slide?.blocks || [], [slide?.blocks])
  const blockIds = useMemo(() => blocks.map((b: AnyBlock) => b.id), [blocks])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = blocks.findIndex((b: AnyBlock) => b.id === active.id)
    const newIndex = blocks.findIndex((b: AnyBlock) => b.id === over.id)
    onReorderBlocks(arrayMove(blocks, oldIndex, newIndex))
  }

  if (blocks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center max-w-md">
          <div className="text-4xl mb-3 opacity-30">📋</div>
          <h3 className="text-gray-400 font-semibold mb-1">Empty slide</h3>
          <p className="text-gray-500 text-sm">
            Add blocks from the left panel to build your lesson slide.
          </p>
        </div>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 max-w-2xl mx-auto">
          {blocks.map((block: AnyBlock) => (
            <BlockPreview
              key={block.id}
              block={block}
              isSelected={block.id === selectedBlockId}
              onSelect={() => onSelectBlock(block.id)}
              onDelete={() => onDeleteBlock(block.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
