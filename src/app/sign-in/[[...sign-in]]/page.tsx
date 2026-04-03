import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#F5F0EB' }}
    >
      <SignIn
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
