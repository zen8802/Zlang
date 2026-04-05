export default function CulturalCard({ deepDive, whyFunny }: {
  deepDive: Record<string, unknown> | null
  whyFunny: string | null
}) {
  return (
    <div className="space-y-4">
      {deepDive && (
        <div className="glass-card p-5">
          <h3 className="font-display font-bold text-accent mb-3">Culture</h3>
          <p className="font-bold text-foreground mb-2">{deepDive.headline as string}</p>
          <p className="text-sm text-foreground/60 leading-relaxed">{deepDive.body as string}</p>
          {typeof deepDive.neverInTextbook === 'string' && (
            <div className="mt-3 p-3 bg-accent/5 rounded-xl">
              <p className="text-xs text-accent font-medium">Not in any textbook:</p>
              <p className="text-sm text-foreground/70 mt-1">{deepDive.neverInTextbook as string}</p>
            </div>
          )}
        </div>
      )}
      {whyFunny && (
        <div className="glass-card p-5">
          <h3 className="font-display font-bold mb-2">Why is this funny?</h3>
          <p className="text-sm text-foreground/60">{whyFunny}</p>
        </div>
      )}
    </div>
  )
}
