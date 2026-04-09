interface ProgressBarProps {
  value: number
  color?: string
  height?: number
  animated?: boolean
  label?: string
}

export default function ProgressBar({
  value,
  animated = true,
}: ProgressBarProps) {
  return (
    <div className="w-full rounded-full overflow-hidden bg-[#E0DAD2]" style={{ height: 2 }}>
      <div
        className={animated ? 'transition-all duration-700 ease-out' : ''}
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: '100%',
          borderRadius: '100px',
          background: '#1B4F8A',
        }}
      />
    </div>
  )
}
