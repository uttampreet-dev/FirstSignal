'use client'
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'

export interface TourStep {
  /** Dashboard tab this step's target lives on. */
  tab: string
  /** [data-tour="..."] value of the element to spotlight. */
  selector: string
  title: string
  description: string
  /** Optional CSS selector to scroll to before spotlighting (defaults to the spotlight element). */
  scrollTarget?: string
}

const PAD = 8
const CARD_WIDTH = 320
const AUTO_PLAY_MS = 5000

const COMPLETION_ITEMS = [
  'Live sentiment monitoring',
  'Cross-session customer memory',
  'Autonomous issue resolution',
  'Proactive complaint prevention',
  'AI voice escalation',
  'Business impact tracking',
]

export default function DemoTour({
  steps,
  activeTab,
  setActiveTab,
  onClose,
}: {
  steps: TourStep[]
  activeTab: string
  setActiveTab: (tab: string) => void
  onClose: () => void
}) {
  // Step 0 = welcome, 1..steps.length = content, steps.length+1 = completion
  const totalSteps = steps.length + 2
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [cardH, setCardH] = useState(200)
  const [autoPlay, setAutoPlay] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  // The tab the user was on when the tour opened — restored when the tour closes
  const initialTabRef = useRef(activeTab)

  const isWelcome = step === 0
  const isComplete = step === totalSteps - 1
  const contentIndex = step - 1
  const contentStep = (!isWelcome && !isComplete) ? steps[contentIndex] : null
  const isContent = !!contentStep

  // Close the tour and return to the tab the user started on
  const handleClose = useCallback(() => {
    setActiveTab(initialTabRef.current)
    onClose()
  }, [setActiveTab, onClose])

  // Core navigation — does NOT cancel auto-play (used by the auto-play timer)
  const goNext = useCallback(() => setStep(s => (s >= totalSteps - 1 ? s : s + 1)), [totalSteps])
  const goPrev = useCallback(() => setStep(s => Math.max(0, s - 1)), [])

  // User-initiated navigation cancels auto-play
  const userNext = useCallback(() => {
    setAutoPlay(false)
    if (step >= totalSteps - 1) handleClose()
    else goNext()
  }, [step, totalSteps, handleClose, goNext])
  const userPrev = useCallback(() => { setAutoPlay(false); goPrev() }, [goPrev])

  // Switch to the tab that holds the current content step's target
  useEffect(() => {
    if (contentStep && contentStep.tab !== activeTab) setActiveTab(contentStep.tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Scroll the target into view, then update the rect. We DON'T clear the old rect
  // first — keeping it lets the spotlight and card glide smoothly to the new target
  // (via their CSS transitions) instead of vanishing and reappearing.
  useEffect(() => {
    if (!contentStep) { setRect(null); return }
    // Wait for a tab switch to render before measuring; short delay within a tab
    const delay = contentStep.tab !== activeTab ? 400 : 100
    const t = setTimeout(() => {
      const scrollSel = contentStep.scrollTarget || `[data-tour="${contentStep.selector}"]`
      const scrollEl = document.querySelector(scrollSel) as HTMLElement | null
      scrollEl?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      const el = document.querySelector(`[data-tour="${contentStep.selector}"]`) as HTMLElement | null
      if (el) setRect(el.getBoundingClientRect()) // only update when found — never null
    }, delay)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, activeTab, contentStep?.selector, contentStep?.tab])

  // Track the card's real height so it stays fully on-screen
  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight)
  }, [step, rect])

  // Keep the spotlight aligned on resize/scroll
  useEffect(() => {
    if (!contentStep) return
    const remeasure = () => {
      const el = document.querySelector(`[data-tour="${contentStep.selector}"]`) as HTMLElement | null
      if (el) setRect(el.getBoundingClientRect())
    }
    window.addEventListener('resize', remeasure)
    window.addEventListener('scroll', remeasure, true)
    return () => {
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('scroll', remeasure, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentStep?.selector])

  // Auto-play: advance every 5s while on a content step
  useEffect(() => {
    if (!autoPlay || !isContent) return
    const t = setTimeout(goNext, AUTO_PLAY_MS)
    return () => clearTimeout(t)
  }, [autoPlay, step, isContent, goNext])

  // Keyboard support: → / Space next · ← prev · Esc exit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); userNext() }
      else if (e.key === 'ArrowLeft') userPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [userNext, userPrev, handleClose])

  // Position the content tooltip near the target, always clamped on-screen
  let cardStyle: React.CSSProperties = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
  if (rect) {
    const M = 16, GAP = 14
    const vh = window.innerHeight
    const left = Math.min(Math.max(rect.left, M), window.innerWidth - CARD_WIDTH - M)
    let top: number
    if (vh - rect.bottom > cardH + GAP + M) top = rect.bottom + GAP
    else if (rect.top > cardH + GAP + M) top = rect.top - GAP - cardH
    else top = rect.top
    top = Math.min(Math.max(top, M), Math.max(vh - cardH - M, M))
    cardStyle = { top, left, transform: 'none' }
  }

  const launchDemo = () => { onClose(); window.location.href = '/chat' }
  const spotlightBox: React.CSSProperties = rect
    ? { position: 'fixed', top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2, borderRadius: 10, pointerEvents: 'none', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }
    : {}

  return (
    <div className="fixed inset-0 z-[200]" style={{ fontFamily: 'monospace' }}>
      {/* Click blocker — prevents interacting with the dashboard during the tour */}
      <div className="absolute inset-0" />

      {/* Backdrop / spotlight */}
      {isWelcome || isComplete ? (
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.82)' }} />
      ) : rect ? (
        <>
          {/* Dark overlay with a hole punched over the target */}
          <div style={{ ...spotlightBox, boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)' }} />
          {/* Gently pulsing emerald border ring */}
          <div className="animate-pulse-border" style={{ ...spotlightBox, border: '1px solid rgba(16,185,129,0.9)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.78)' }} />
      )}

      {/* WELCOME (step 0) */}
      {isWelcome && (
        <div className="fixed inset-0 flex items-center justify-center p-6">
          <div className="w-[380px] max-w-full bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-5">
              <span className="text-black text-sm font-bold">FS</span>
            </div>
            <h2 className="text-xl text-white font-medium mb-2">Welcome to FirstSignal</h2>
            <p className="text-[12px] text-[#888] leading-relaxed mb-4">
              We&apos;ll show how AI detects customer frustration before churn happens.
            </p>
            <p className="text-[10px] text-[#444] uppercase tracking-widest mb-6">Estimated time: 60 seconds</p>
            <button onClick={userNext}
              className="w-full bg-emerald-500 text-black text-sm font-medium py-2.5 rounded-lg hover:bg-emerald-400 transition-colors">
              Start Tour →
            </button>
            <button onClick={handleClose}
              className="mt-3 text-[10px] text-[#444] hover:text-[#888] uppercase tracking-widest transition-colors">
              Skip
            </button>
          </div>
        </div>
      )}

      {/* COMPLETION (final step) */}
      {isComplete && (
        <div className="fixed inset-0 flex items-center justify-center p-6">
          <div className="relative w-[420px] max-w-full bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-8 shadow-2xl">
            <button onClick={handleClose} aria-label="Close and return to dashboard"
              className="absolute top-4 right-4 text-[#444] hover:text-[#999] text-sm transition-colors leading-none">
              ✕
            </button>
            <h2 className="text-2xl text-emerald-400 font-mono text-center mb-6">Mission Complete</h2>
            <div className="space-y-2.5 mb-7">
              {COMPLETION_ITEMS.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 animate-stepin"
                  style={{ animationDelay: `${i * 200}ms`, animationFillMode: 'backwards' }}>
                  <span className="text-emerald-500 text-sm flex-shrink-0">✓</span>
                  <span className="text-[12px] text-[#ccc]">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setAutoPlay(false); setStep(1) }}
                className="flex-1 text-xs py-2.5 rounded-lg border border-[#1a1a1a] text-[#888] hover:text-[#ccc] hover:border-[#222] transition-all uppercase tracking-widest">
                Restart Tour
              </button>
              <button onClick={launchDemo}
                className="flex-1 text-xs py-2.5 rounded-lg bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition-colors uppercase tracking-widest">
                Launch Demo →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TOOLTIP — stays mounted across steps so it glides to each target.
          Gated on rect so it never flashes at the centered fallback position. */}
      {contentStep && rect && (
        <div
          ref={cardRef}
          className="fixed rounded-xl bg-[#0d0d0d] border border-[#1a1a1a] shadow-2xl overflow-hidden animate-fadein"
          style={{ width: CARD_WIDTH, ...cardStyle, transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1)' }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-emerald-500 uppercase tracking-widest">Guided Demo</span>
                <button onClick={() => setAutoPlay(a => !a)}
                  className="text-[9px] text-[#555] hover:text-[#888] border border-[#1a1a1a] hover:border-[#222] rounded px-1.5 py-0.5 transition-colors">
                  {autoPlay ? '⏸ Pause' : '▶ Auto'}
                </button>
              </div>
              <span className="text-[9px] text-[#444] font-mono tracking-widest">{step} of {steps.length}</span>
            </div>

            <h3 className="text-sm font-medium text-[#e5e5e5] mb-1.5">{contentStep.title}</h3>
            <p className="text-[11px] text-[#666] leading-relaxed">{contentStep.description}</p>

            {/* Step dots */}
            <div className="flex items-center gap-1.5 mt-3.5 mb-3">
              {steps.map((_, i) => (
                <div key={i} className="h-1 rounded-full transition-all duration-300"
                  style={{ width: i === contentIndex ? 16 : 6, background: i === contentIndex ? '#10b981' : i < contentIndex ? '#10b98155' : '#1a1a1a' }} />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button onClick={handleClose}
                className="text-[10px] text-[#444] hover:text-[#888] uppercase tracking-widest transition-colors">
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                <button onClick={userPrev}
                  className="text-[10px] px-3 py-1.5 rounded border border-[#1a1a1a] text-[#666] hover:text-[#999] hover:border-[#222] transition-all uppercase tracking-widest">
                  Previous
                </button>
                <button onClick={userNext}
                  className="text-[10px] px-3 py-1.5 rounded bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition-colors uppercase tracking-widest">
                  {step === steps.length ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>

            {/* Keyboard hint */}
            <p className="text-[9px] text-[#333] text-center mt-3">← → navigate · Esc exit</p>
          </div>

          {/* Auto-play progress bar — fills over 5s */}
          {autoPlay && (
            <div className="h-0.5 bg-[#141414]">
              <div key={step} className="h-full bg-emerald-500 animate-tourbar5" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
