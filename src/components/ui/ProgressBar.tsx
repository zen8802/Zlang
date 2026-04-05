interface ProgressBarProps {
  value: number
  color?: string
  height?: number
  animated?: boolean
  label?: string
}

export default function ProgressBar({
  value,
  color = '#1B4F8A',
  height = 12,
  animated = true,
}: ProgressBarProps) {
  return (
    <div className="w-full rounded-full overflow-hidden bg-gray-100" style={{ height }}>
      <div
        className={animated ? 'transition-all duration-700 ease-out' : ''}
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: '100%',
          borderRadius: '100px',
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          boxShadow: `0 2px 4px ${color}44`,
        }}
      />
    </div>
  )
}
