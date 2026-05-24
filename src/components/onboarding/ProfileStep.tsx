'use client'

import Button from '@/components/ui/Button'

interface Props {
  birthYear: number | null
  gender: string | null
  onChangeBirthYear: (v: number) => void
  onChangeGender: (v: string) => void
  onContinue: () => void
  onBack: () => void
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', labelJP: '男性' },
  { value: 'female', label: 'Female', labelJP: '女性' },
  { value: 'other', label: 'Other / prefer not to say', labelJP: 'その他' },
]

const CURRENT_YEAR = new Date().getFullYear()
// Min age 13, max ~82. Most-recent first feels nicer in a long select.
const YEARS = Array.from({ length: 70 }, (_, i) => CURRENT_YEAR - 13 - i)

export function ProfileStep({
  birthYear,
  gender,
  onChangeBirthYear,
  onChangeGender,
  onContinue,
  onBack,
}: Props) {
  const age = birthYear ? CURRENT_YEAR - birthYear : null
  const canContinue = !!birthYear && !!gender

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
          A little about you
        </h1>
        <p
          className="text-[#9E9892] text-sm leading-relaxed"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Japanese speech changes significantly with age and gender. We use
          this to teach you language that actually fits you.
        </p>
      </div>

      <div className="space-y-8 flex-1">
        {/* Gender */}
        <div>
          <label
            className="block text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-3"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Gender
          </label>
          <div className="space-y-2">
            {GENDER_OPTIONS.map((opt) => {
              const isSelected = gender === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => onChangeGender(opt.value)}
                  className="w-full text-left px-5 py-4 rounded-[10px] border-2 transition-all duration-150 active:translate-y-px flex items-center justify-between"
                  style={{
                    backgroundColor: isSelected ? '#EBF0F8' : '#FDFBF8',
                    borderColor: isSelected ? '#1B4F8A' : '#E0DAD2',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                      style={{
                        borderColor: isSelected ? '#1B4F8A' : '#C8C3BC',
                        backgroundColor: isSelected ? '#1B4F8A' : 'transparent',
                      }}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span
                      className="text-sm font-medium text-[#1A1814]"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: 'Noto Sans JP, sans-serif',
                      color: isSelected ? '#1B4F8A' : '#C8C3BC',
                    }}
                  >
                    {opt.labelJP}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Birth year */}
        <div>
          <label
            className="block text-[10px] tracking-widest uppercase text-[#9E9892] font-medium mb-3"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Year of birth
          </label>
          <select
            value={birthYear || ''}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10)
              if (Number.isFinite(n)) onChangeBirthYear(n)
            }}
            className="w-full bg-[#FDFBF8] border-2 rounded-[10px] px-5 py-4 outline-none appearance-none cursor-pointer text-base transition-colors"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              borderColor: birthYear ? '#1B4F8A' : '#E0DAD2',
              color: birthYear ? '#1A1814' : '#C8C3BC',
            }}
          >
            <option value="" disabled>
              Select year
            </option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {age !== null && (
            <p
              className="text-xs mt-2 text-[#9E9892]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Age {age}
              {age < 18 && ' · junior learner'}
              {age >= 60 && ' · senior learner'}
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="pt-8 pb-10 space-y-3">
        <Button variant="primary" size="lg" fullWidth onClick={onContinue} disabled={!canContinue}>
          Continue →
        </Button>
        <button
          onClick={onBack}
          className="w-full text-center text-sm text-[#9E9892] hover:text-[#6B6560] transition-colors py-1"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
