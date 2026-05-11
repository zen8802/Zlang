'use client'

import type { LessonBlock } from '@/types/lesson-blocks'
import FlashcardBlockRenderer from './FlashcardBlockRenderer'
import SentenceBlockRenderer from './SentenceBlockRenderer'
import QuizBlockRenderer from './QuizBlockRenderer'
import FillBlankBlockRenderer from './FillBlankBlockRenderer'
import MatchingBlockRenderer from './MatchingBlockRenderer'
import CultureNoteBlockRenderer from './CultureNoteBlockRenderer'
import ShadowingBlockRenderer from './ShadowingBlockRenderer'
import { ImageMatchBlockRenderer } from './ImageMatchBlockRenderer'
import { AudioMatchBlockRenderer } from './AudioMatchBlockRenderer'
import { DialogueChoiceBlockRenderer } from './DialogueChoiceBlockRenderer'
import WordBankBlockRenderer from './WordBankBlockRenderer'
import EncounterBlockRenderer from './EncounterBlockRenderer'
import RecognitionQuizBlockRenderer from './RecognitionQuizBlockRenderer'
import SentenceBuildBlockRenderer from './SentenceBuildBlockRenderer'
import ConversationReplayBlockRenderer from './ConversationReplayBlockRenderer'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  block: LessonBlock | any
  onComplete: (xp: number) => void
}

export default function BlockRenderer({ block, onComplete }: Props) {
  switch (block.type) {
    case 'flashcard':
      return <FlashcardBlockRenderer block={block} onComplete={onComplete} />
    case 'sentence':
      return <SentenceBlockRenderer block={block} onComplete={onComplete} />
    case 'quiz':
      return <QuizBlockRenderer block={block} onComplete={onComplete} />
    case 'fill_blank':
      return <FillBlankBlockRenderer block={block} onComplete={onComplete} />
    case 'matching':
      return <MatchingBlockRenderer block={block} onComplete={onComplete} />
    case 'culture_note':
      return <CultureNoteBlockRenderer block={block} onComplete={onComplete} />
    case 'shadowing':
      return <ShadowingBlockRenderer block={block} onComplete={onComplete} />
    case 'image_match':
      return <ImageMatchBlockRenderer block={block} onComplete={onComplete} />
    case 'audio_match':
      return <AudioMatchBlockRenderer block={block} onComplete={onComplete} />
    case 'dialogue_choice':
      return <DialogueChoiceBlockRenderer block={block} onComplete={onComplete} />
    case 'word_bank':
      return <WordBankBlockRenderer block={block} onComplete={onComplete} />
    case 'encounter':
      return <EncounterBlockRenderer block={block} onComplete={onComplete} />
    case 'recognition_quiz':
      return <RecognitionQuizBlockRenderer block={block} onComplete={onComplete} />
    case 'sentence_build':
      return <SentenceBuildBlockRenderer block={block} onComplete={onComplete} />
    case 'conversation_replay':
      return <ConversationReplayBlockRenderer block={block} onComplete={onComplete} />
    case 'video':
    case 'translation':
    case 'reading':
      return (
        <div className="page-enter py-8 text-center">
          <p className="text-[#6B7280] text-sm font-semibold" style={{ fontFamily: 'var(--font-ui)' }}>
            Block type &ldquo;{block.type}&rdquo; not yet supported
          </p>
        </div>
      )
    default:
      // Legacy block types (trace, hiragana_intro, dialogue_translate) — skip
      onComplete(0)
      return null
  }
}
