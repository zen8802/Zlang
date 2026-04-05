export default function LessonSkeleton({ message }: { message: string }) {
  return (
    <div className="space-y-4">
      <div className="h-48 bg-black/[0.05] rounded-2xl animate-pulse" />
      <div className="glass-card p-5 space-y-3">
        <div className="h-4 bg-black/[0.07] rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-black/[0.05] rounded w-1/2 animate-pulse" />
      </div>
      <div className="glass-card p-5 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-7 bg-black/[0.07] rounded w-full animate-pulse" />
            <div className="h-3 bg-black/[0.04] rounded w-2/3 animate-pulse" />
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-foreground/30">{message}</p>
    </div>
  )
}
