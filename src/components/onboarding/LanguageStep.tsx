'use client'

import Button from '@/components/ui/Button'

interface Props {
  value: 'en-to-jp' | 'jp-to-en'
  onChange: (v: 'en-to-jp' | 'jp-to-en') => void
  onContinue: () => void
}

const OPTIONS = [
  {
    value: 'en-to-jp' as const,
    from: 'English',
    to: 'Japanese',
    fromFlag: '🇺🇸',
    toFlag: '🇯🇵',
    toScript: '日本語',
    description: 'Learn Japanese as an English speaker',
  },
  {
    value: 'jp-to-en' as const,
    from: 'Japanese',
    to: 'English',
    fromFlag: '🇯🇵',
    toFlag: '🇺🇸',
    toScript: 'English',
    description: 'Learn English as a Japanese speaker',
  },
]

export function LanguageStep({ value, onChange, onContinue }: Props) {
  return (
    <div className="flex flex-col flex-1 max-w-sm mx-auto w-full">
      {/* Question */}
      <div className="mb-10">
        <h1
          className="text-[#1A1814] mb-3"
          style={{
            fontFamily: 'Shippori Mincho, serif',
            fontSize: '28px',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          }}
        >
          What are you here to learn?
        </h1>
        <p
          className="text-[#9E9892] text-sm leading-relaxed"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Kombu adapts everything — vocabulary, dialogue style, and difficulty
          — to your learning direction.
        </p>
      </div>

      {/* Language options */}
      <div className="space-y-3 flex-1">
        {OPTIONS.map((option) => {
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className="w-full text-left rounded-[10px] p-5 border-2 transition-all duration-200 active:translate-y-px"
              style={{
                backgroundColor: isSelected ? '#EBF0F8' : '#FDFBF8',
                borderColor: isSelected ? '#1B4F8A' : '#E0DAD2',
              }}
            >
              {/* Language pair line */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{option.fromFlag}</span>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: isSelected ? '#1B4F8A' : '#E0DAD2' }}
                />
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    backgroundColor: isSelected ? '#1B4F8A' : '#E0DAD2',
                    color: isSelected ? 'white' : '#9E9892',
                  }}
                >
                  →
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: isSelected ? '#1B4F8A' : '#E0DAD2' }}
                />
                <span className="text-2xl">{option.toFlag}</span>
              </div>

              {/* Labels */}
              <div className="flex items-baseline justify-between">
                <div>
                  <p
                    className="font-semibold text-[#1A1814]"
                    style={{
                      fontFamily: 'Shippori Mincho, serif',
                      fontSize: '18px',
                    }}
                  >
                    {option.from} → {option.to}
                  </p>
                  <p
                    className="text-base mt-0.5"
                    style={{
                      fontFamily:
                        option.value === 'en-to-jp'
                          ? 'Noto Sans JP, sans-serif'
                          : 'DM Sans, sans-serif',
                      color: '#6B6560',
                    }}
                  >
                    {option.toScript}
                  </p>
                </div>

                {/* Selected indicator */}
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: isSelected ? '#1B4F8A' : '#C8C3BC',
                    backgroundColor: isSelected ? '#1B4F8A' : 'transparent',
                  }}
                >
                  {isSelected && (
                    <span className="text-white text-[10px]">✓</span>
                  )}
                </div>
              </div>

              <p
                className="text-xs text-[#9E9892] mt-2"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {option.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Continue */}
      <div className="pt-8 pb-10">
        <Button variant="primary" size="lg" fullWidth onClick={onContinue}>
          Continue →
        </Button>
      </div>
    </div>
  )
}
