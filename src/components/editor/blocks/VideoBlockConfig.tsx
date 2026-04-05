'use client'

import { InspectorField, INPUT_CLASS, TEXTAREA_CLASS, SELECT_CLASS } from './shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VideoBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  return (
    <div className="space-y-3">
      <InspectorField label="YouTube Video ID">
        <input
          value={block.clipId || ''}
          onChange={e => onChange({ ...block, clipId: e.target.value })}
          placeholder="e.g. dQw4w9WgXcQ"
          className={INPUT_CLASS}
        />
      </InspectorField>
      <InspectorField label="Clip Title">
        <input
          value={block.clipTitle || ''}
          onChange={e => onChange({ ...block, clipTitle: e.target.value })}
          placeholder="Video title..."
          className={INPUT_CLASS}
        />
      </InspectorField>
      <InspectorField label="Instruction">
        <textarea
          value={block.instruction || ''}
          onChange={e => onChange({ ...block, instruction: e.target.value })}
          rows={2}
          placeholder="Watch this clip carefully..."
          className={TEXTAREA_CLASS}
        />
      </InspectorField>
      <InspectorField label="Start (seconds)">
        <input type="number" value={block.startSeconds || 0} onChange={e => onChange({ ...block, startSeconds: parseInt(e.target.value) || 0 })} className={INPUT_CLASS} />
      </InspectorField>
      <InspectorField label="End (seconds)">
        <input type="number" value={block.endSeconds || 0} onChange={e => onChange({ ...block, endSeconds: parseInt(e.target.value) || 0 })} className={INPUT_CLASS} />
      </InspectorField>
      <InspectorField label="Completion trigger">
        <select value={block.completionTrigger || 'watched'} onChange={e => onChange({ ...block, completionTrigger: e.target.value })} className={SELECT_CLASS}>
          <option value="watched">After watching</option>
          <option value="answered">After answering</option>
        </select>
      </InspectorField>
    </div>
  )
}
