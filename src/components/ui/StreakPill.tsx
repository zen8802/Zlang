export default function StreakPill({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#F0EDE8] border border-[#6B6560]/20 rounded-full px-3 py-1">
      <span className="text-sm font-medium text-[#6B6560]">{streak}日</span>
    </div>
  )
}
