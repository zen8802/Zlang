export default function XPPill({ xp }: { xp: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#FFF3CC] border border-[#FFB800] rounded-full px-3 py-1">
      <span className="text-base">⚡</span>
      <span className="text-sm font-black text-[#CC7700]">{xp} XP</span>
    </div>
  )
}
