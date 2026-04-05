'use client'

// ---------------------------------------------------------------------------
// Translation keys used (add to useAppStore if missing):
//   settings.title, settings.uiLanguage, settings.corridor, settings.level,
//   settings.resetProgress, settings.resetConfirm,
//   settings.about, settings.version, settings.resetAll,
//   settings.switchCorridorWarning, settings.languageLearning,
//   settings.progress, settings.currentStreak,
//   settings.totalXP, settings.lessonsCompleted
// ---------------------------------------------------------------------------

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { useAppStore, t } from '@/store/useAppStore'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const uiLanguage = useAppStore((s) => s.uiLanguage)
  const setUiLanguage = useAppStore((s) => s.setUiLanguage)
  const corridor = useAppStore((s) => s.corridor)
  const setCorridor = useAppStore((s) => s.setCorridor)
  const level = useAppStore((s) => s.level)
  const setLevel = useAppStore((s) => s.setLevel)
  const xpTotal = useAppStore((s) => s.xpTotal)
  const streak = useAppStore((s) => s.streak)
  const lessonsCompleted = useAppStore((s) => s.lessonsCompleted)
  const resetProgress = useAppStore((s) => s.resetProgress)
  const resetAll = useAppStore((s) => s.resetAll)

  const [showCorridorModal, setShowCorridorModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showResetAllModal, setShowResetAllModal] = useState(false)
  const [pendingCorridor, setPendingCorridor] = useState<'en-to-jp' | 'jp-to-en' | null>(null)

  // ------- Handlers -------
  const handleCorridorSwitch = useCallback(
    (newCorridor: 'en-to-jp' | 'jp-to-en') => {
      if (newCorridor === corridor) return
      setPendingCorridor(newCorridor)
      setShowCorridorModal(true)
    },
    [corridor],
  )

  const confirmCorridorSwitch = useCallback(() => {
    if (pendingCorridor) {
      setCorridor(pendingCorridor)
    }
    setShowCorridorModal(false)
    setPendingCorridor(null)
  }, [pendingCorridor, setCorridor])

  const handleResetProgress = useCallback(() => {
    resetProgress()
    setShowResetModal(false)
  }, [resetProgress])

  const handleResetAll = useCallback(() => {
    resetAll()
    setShowResetAllModal(false)
  }, [resetAll])

  // ------- Level options -------
  const levelOptions: Array<{ value: 'beginner' | 'basics' | 'intermediate' | 'advanced'; label: string }> = [
    { value: 'beginner', label: uiLanguage === 'en' ? 'Beginner' : '初心者' },
    { value: 'basics', label: uiLanguage === 'en' ? 'Basics' : '基礎' },
    { value: 'intermediate', label: uiLanguage === 'en' ? 'Intermediate' : '中級' },
    { value: 'advanced', label: uiLanguage === 'en' ? 'Advanced' : '上級' },
  ]

  // ------- Section animation -------
  const sectionVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' as const, delay: i * 0.08 },
    }),
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 pb-24 md:pb-8">
        <h1 className="text-3xl font-display font-bold text-accent text-glow mb-8">
          {t('settings.title', uiLanguage)}
        </h1>

        {/* ===== Language & Learning ===== */}
        <motion.div custom={0} initial="hidden" animate="visible" variants={sectionVariants}>
          <Card padding="lg" className="mb-5">
            <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
              <span className="text-accent/60">⚙</span>
              {uiLanguage === 'en' ? 'Language & Learning' : '言語と学習'}
            </h2>

            {/* UI Language toggle */}
            <div className="flex items-center justify-between py-3 border-b border-black/[0.06]">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('settings.uiLanguage', uiLanguage)}
                </p>
                <p className="text-xs text-foreground/40">
                  {uiLanguage === 'en' ? 'App interface language' : 'アプリのインターフェース言語'}
                </p>
              </div>
              <div className="flex items-center rounded-xl bg-black/[0.03] border border-black/10 p-0.5">
                <button
                  onClick={() => setUiLanguage('en')}
                  className={[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    uiLanguage === 'en'
                      ? 'bg-accent text-background shadow-[0_0_12px_rgba(27,79,138,0.3)]'
                      : 'text-foreground/50 hover:text-foreground/80',
                  ].join(' ')}
                >
                  English
                </button>
                <button
                  onClick={() => setUiLanguage('jp')}
                  className={[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    uiLanguage === 'jp'
                      ? 'bg-accent text-background shadow-[0_0_12px_rgba(27,79,138,0.3)]'
                      : 'text-foreground/50 hover:text-foreground/80',
                  ].join(' ')}
                >
                  日本語
                </button>
              </div>
            </div>

            {/* Learning Path / Corridor */}
            <div className="py-3 border-b border-black/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {uiLanguage === 'en' ? 'Learning Path' : '学習パス'}
                  </p>
                  <p className="text-xs text-foreground/40">
                    {uiLanguage === 'en' ? 'Your language corridor' : '言語コリドー'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCorridorSwitch('en-to-jp')}
                  className={[
                    'rounded-xl px-4 py-3 text-left transition-all duration-200 border',
                    corridor === 'en-to-jp'
                      ? 'bg-accent-jp/10 border-accent-jp/30 shadow-[0_0_16px_rgba(255,107,53,0.15)]'
                      : 'bg-black/[0.03] border-black/10 hover:bg-black/[0.05] hover:border-black/15',
                  ].join(' ')}
                >
                  <p className="text-sm font-medium text-foreground">EN → JP</p>
                  <p className="text-xs text-foreground/40 mt-0.5">
                    {uiLanguage === 'en' ? 'Learn Japanese' : '日本語を学ぶ'}
                  </p>
                </button>
                <button
                  onClick={() => handleCorridorSwitch('jp-to-en')}
                  className={[
                    'rounded-xl px-4 py-3 text-left transition-all duration-200 border',
                    corridor === 'jp-to-en'
                      ? 'bg-accent-en/10 border-accent-en/30 shadow-[0_0_16px_rgba(59,130,246,0.15)]'
                      : 'bg-black/[0.03] border-black/10 hover:bg-black/[0.05] hover:border-black/15',
                  ].join(' ')}
                >
                  <p className="text-sm font-medium text-foreground">JP → EN</p>
                  <p className="text-xs text-foreground/40 mt-0.5">
                    {uiLanguage === 'en' ? 'Learn English' : '英語を学ぶ'}
                  </p>
                </button>
              </div>
            </div>

            {/* Current Level */}
            <div className="py-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('settings.level', uiLanguage)}
                  </p>
                  <p className="text-xs text-foreground/40">
                    {uiLanguage === 'en' ? 'Adjust lesson difficulty' : 'レッスンの難易度を調整'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {levelOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLevel(opt.value)}
                    className={[
                      'rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border',
                      level === opt.value
                        ? 'bg-accent/10 border-accent/30 text-accent shadow-[0_0_12px_rgba(27,79,138,0.15)]'
                        : 'bg-black/[0.03] border-black/10 text-foreground/60 hover:bg-black/[0.05] hover:text-foreground/80',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ===== Progress ===== */}
        <motion.div custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
          <Card padding="lg" className="mb-5">
            <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
              <span className="text-accent/60">📊</span>
              {uiLanguage === 'en' ? 'Progress' : '進捗'}
            </h2>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center py-3 rounded-xl bg-black/[0.03] border border-black/[0.06]">
                <p className="text-2xl font-bold text-accent tabular-nums">{xpTotal}</p>
                <p className="text-xs text-foreground/40 mt-0.5">
                  {uiLanguage === 'en' ? 'Total XP' : '合計XP'}
                </p>
              </div>
              <div className="text-center py-3 rounded-xl bg-black/[0.03] border border-black/[0.06]">
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {streak}
                  <span className="text-sm ml-0.5">🔥</span>
                </p>
                <p className="text-xs text-foreground/40 mt-0.5">
                  {uiLanguage === 'en' ? 'Day Streak' : '日連続'}
                </p>
              </div>
              <div className="text-center py-3 rounded-xl bg-black/[0.03] border border-black/[0.06]">
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {lessonsCompleted.length}
                </p>
                <p className="text-xs text-foreground/40 mt-0.5">
                  {uiLanguage === 'en' ? 'Lessons' : 'レッスン'}
                </p>
              </div>
            </div>

            {/* Reset buttons */}
            <div className="space-y-3">
              <Button
                variant="wrong"
                fullWidth
                onClick={() => setShowResetModal(true)}
              >
                {t('settings.resetProgress', uiLanguage)}
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setShowResetAllModal(true)}
                className="!text-red-400/70 hover:!text-red-400"
              >
                {t('settings.resetAll', uiLanguage)}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* ===== About ===== */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={sectionVariants}>
          <Card padding="lg" className="mb-5">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="text-accent/60">ℹ</span>
              {t('settings.about', uiLanguage)}
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/60">
                  {uiLanguage === 'en' ? 'App Name' : 'アプリ名'}
                </span>
                <span className="text-sm font-semibold text-accent">Zlang</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/60">
                  {t('settings.version', uiLanguage)}
                </span>
                <span className="text-sm text-foreground/80 tabular-nums">0.1.0</span>
              </div>
              <div className="pt-2 border-t border-black/[0.06]">
                <p className="text-sm text-foreground/40 italic text-center">
                  {uiLanguage === 'en'
                    ? '"Learn through what you love"'
                    : '「好きなもので学ぼう」'}
                </p>
              </div>
              <div className="text-center pt-1">
                <p className="text-xs text-foreground/30">
                  {t('common.poweredBy', uiLanguage)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>

      <MobileNav />

      {/* ===== Corridor Switch Warning Modal ===== */}
      <Modal
        isOpen={showCorridorModal}
        onClose={() => {
          setShowCorridorModal(false)
          setPendingCorridor(null)
        }}
        title={uiLanguage === 'en' ? 'Switch Learning Path?' : '学習パスを変更しますか？'}
      >
        <p className="text-sm text-foreground/60 mb-5">
          {uiLanguage === 'en'
            ? 'Switching your learning corridor will change the content and lessons available. Your progress will be preserved.'
            : '学習コリドーを変更すると、利用可能なコンテンツとレッスンが変わります。進捗は保持されます。'}
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setShowCorridorModal(false)
              setPendingCorridor(null)
            }}
          >
            {t('common.cancel', uiLanguage)}
          </Button>
          <Button variant="primary" fullWidth onClick={confirmCorridorSwitch}>
            {t('common.confirm', uiLanguage)}
          </Button>
        </div>
      </Modal>

      {/* ===== Reset Progress Modal ===== */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title={t('settings.resetProgress', uiLanguage)}
      >
        <p className="text-sm text-foreground/60 mb-5">
          {t('settings.resetConfirm', uiLanguage)}
        </p>
        <p className="text-xs text-foreground/40 mb-5">
          {uiLanguage === 'en'
            ? 'This will reset your XP, streak, lesson progress, and skill levels. Your account settings will be preserved.'
            : 'XP、ストリーク、レッスンの進捗、スキルレベルがリセットされます。アカウント設定は保持されます。'}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowResetModal(false)}>
            {t('common.cancel', uiLanguage)}
          </Button>
          <Button variant="wrong" fullWidth onClick={handleResetProgress}>
            {t('settings.resetProgress', uiLanguage)}
          </Button>
        </div>
      </Modal>

      {/* ===== Reset All Modal ===== */}
      <Modal
        isOpen={showResetAllModal}
        onClose={() => setShowResetAllModal(false)}
        title={t('settings.resetAll', uiLanguage)}
      >
        <p className="text-sm text-foreground/60 mb-5">
          {t('settings.resetConfirm', uiLanguage)}
        </p>
        <p className="text-xs text-foreground/40 mb-5">
          {uiLanguage === 'en'
            ? 'This will completely reset the app to its initial state, including all settings, progress, and preferences.'
            : 'アプリを初期状態に完全にリセットします。設定、進捗、設定のすべてが削除されます。'}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowResetAllModal(false)}>
            {t('common.cancel', uiLanguage)}
          </Button>
          <Button variant="wrong" fullWidth onClick={handleResetAll}>
            {t('settings.resetAll', uiLanguage)}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
