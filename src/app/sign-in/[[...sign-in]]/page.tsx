import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-10"
      style={{ backgroundColor: '#F5F0EB' }}
    >
      {/* Kombu wordmark */}
      <div
        style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: '24px',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#bbead6',
        }}
      >
        KOMBU
      </div>

      <p
        style={{
          fontFamily: 'Shippori Mincho',
          fontSize: '20px',
          color: '#1A1814',
          letterSpacing: '-0.01em',
        }}
      >
        おかえり — welcome back
      </p>

      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#1B4F8A',
            colorBackground: '#FDFBF8',
            colorText: '#1A1814',
            colorTextSecondary: '#6B6560',
            colorInputBackground: '#FDFBF8',
            colorInputText: '#1A1814',
            colorDanger: '#8B3A3A',
            borderRadius: '10px',
            fontFamily: 'DM Sans, sans-serif',
          },
          elements: {
            rootBox: 'w-full max-w-sm',
            card: 'shadow-[0_2px_16px_rgba(26,24,20,0.06)] border border-[#E0DAD2] rounded-[14px]',
            headerTitle: 'font-display',
            formButtonPrimary:
              'bg-[#1B4F8A] hover:bg-[#4A7AB5] text-white font-medium normal-case rounded-[10px]',
            socialButtonsBlockButton:
              'border border-[#E0DAD2] hover:bg-[#F5F0EB] rounded-[10px]',
            footerActionLink: 'text-[#1B4F8A]',
          },
        }}
      />
    </div>
  )
}
