import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ backgroundColor: '#F5F0EB' }}
    >
      <div className="text-center max-w-sm">
        <p className="text-2xl font-display font-bold" style={{ color: '#1B4F8A' }}>
          Ready to continue?
        </p>
        <p className="text-sm text-foreground/50 mt-1">
          Create a free account to save your progress.
          <br />
          Your first lesson streak is waiting.
        </p>
      </div>
      <SignUp
        appearance={{
          variables: {
            colorPrimary: '#1B4F8A',
            colorBackground: '#FFFFFF',
            colorText: '#1a1a2e',
            borderRadius: '12px',
            fontFamily: 'DM Sans, sans-serif',
          },
          elements: {
            card: 'shadow-2xl border border-black/10',
            headerTitle: 'font-display text-2xl',
          },
        }}
      />
    </div>
  )
}
