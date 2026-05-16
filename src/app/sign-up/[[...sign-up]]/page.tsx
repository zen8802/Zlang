import { SignUp } from '@clerk/nextjs'

/**
 * Username is required at sign-up. The Clerk dashboard must be configured
 * with "Username" set to required under Authentication → Email, Phone, Username
 * for this to render the username field. Once set, Clerk auto-renders it
 * here and we don't need a custom form.
 *
 * The header copy below tells the user upfront what they're picking.
 */
export default function SignUpPage() {
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

      <div className="text-center max-w-sm">
        <p
          style={{
            fontFamily: 'Shippori Mincho',
            fontSize: '22px',
            color: '#1A1814',
            letterSpacing: '-0.01em',
          }}
        >
          Pick a username and you&apos;re in
        </p>
        <p
          className="mt-1.5"
          style={{
            fontFamily: 'DM Sans',
            fontSize: '13px',
            color: '#9E9892',
            lineHeight: 1.5,
          }}
        >
          The header will greet you with こんにちは, [your username].
          You can change it later in settings.
        </p>
      </div>

      <SignUp
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
