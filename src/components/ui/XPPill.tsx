export default function XPPill({ xp }: { xp: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#EBF0F8] border border-[#1B4F8A]/20 rounded-full px-3 py-1">
      <span className="text-sm font-medium text-[#1B4F8A]">{xp.toLocaleString()}</span>
    </div>
  )
}
