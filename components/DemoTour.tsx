'use client'
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'

export interface TourStep {
  /** Dashboard tab this step's target lives on. */
  tab: string
  /** [data-tour="..."] value of the element to spotlight. */
  selector: string
  title: string
  description: string
}

const PAD = 8
const CARD_WIDTH = 320
const AUTO_ADVANCE_MS = 8000

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
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [cardH, setCardH] = useState(200)
  const cardRef = useRef<HTMLDivElement>(null)
  const current = steps[step]

  const next = useCallback(() => {
    if (step >= steps.length - 1) onClose()
    else setStep(s => s + 1)
  }, [step, steps.length, onClose])

  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), [])

  // Switch to the tab that holds this step's target
  useEffect(() => {
    if (current.tab !== activeTab) setActiveTab(current.tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Measure the target once the DOM (and any tab switch) has settled.
  // Scroll it into view first; the capture-phase scroll listener below keeps
  // the spotlight aligned as the smooth scroll settles.
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector(`[data-tour="${current.selector}"]`) as HTMLElement | null
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        setRect(el.getBoundingClientRect())
      } else {
        setRect(null)
      }
    }
    // Give a tab switch time to render before measuring
    const delay = current.tab !== activeTab ? 300 : 80
    const t = setTimeout(measure, delay)
    return () => clearTimeout(t)
  }, [step, activeTab, current.selector, current.tab])

  // Track the card's real height so we can keep it fully on-screen
  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight)
  }, [step, rect])

  // Keep the spotlight aligned on resize/scroll
  useEffect(() => {
    const remeasure = () => {
      const el = document.querySelector(`[data-tour="${current.selector}"]`) as HTMLElement | null
      setRect(el ? el.getBoundingClientRect() : null)
    }
    window.addEventListener('resize', remeasure)
    window.addEventListener('scroll', remeasure, true)
    return () => {
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('scroll', remeasure, true)
    }
  }, [current.selector])

  // Auto-advance after 8s of inactivity
  useEffect(() => {
    const t = setTimeout(next, AUTO_ADVANCE_MS)
    return () => clearTimeout(t)
  }, [step, next])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, onClose])

  const isLast = step === steps.length - 1

  // Position the tooltip card near the target, always clamped fully on-screen.
  let cardStyle: React.CSSProperties = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
  if (rect) {
    const M = 16   // viewport margin
    const GAP = 14 // gap between target and card
    const vh = window.innerHeight
    const left = Math.min(Math.max(rect.left, M), window.innerWidth - CARD_WIDTH - M)

    let top: number
    if (vh - rect.bottom > cardH + GAP + M) {
      top = rect.bottom + GAP                 // below the target
    } else if (rect.top > cardH + GAP + M) {
      top = rect.top - GAP - cardH            // above the target
    } else {
      top = rect.top                          // target fills the screen — sit near its top
    }
    // Never let the card overflow the top or bottom edge
    top = Math.min(Math.max(top, M), Math.max(vh - cardH - M, M))
    cardStyle = { top, left, transform: 'none' }
  }

  return (
    <div className="fixed inset-0 z-[200]" style={{ fontFamily: 'monospace' }}>
      {/* Click blocker — prevents interacting with the dashboard during the tour */}
      <div className="absolute inset-0" />

      {/* Spotlight: a hole punched in a dark overlay via a huge box-shadow spread */}
      {rect ? (
        <div
          style={{
            position: 'fixed',
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)',
            border: '1px solid rgba(16,185,129,0.6)',
            pointerEvents: 'none',
            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.78)' }} />
      )}

      {/* Tooltip card */}
      <div
        ref={cardRef}
        className="fixed rounded-xl bg-[#0d0d0d] border border-[#1a1a1a] shadow-2xl overflow-hidden"
        style={{ width: CARD_WIDTH, ...cardStyle }}
      >
        {/* Auto-advance progress bar — restarts each step via key */}
        <div className="h-0.5 bg-[#141414]">
          <div key={step} className="h-full bg-emerald-500 animate-tourbar" />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[9px] text-emerald-500 uppercase tracking-widest">Guided tour</span>
            <span className="text-[9px] text-[#444] font-mono tracking-widest">{step + 1} of {steps.length}</span>
          </div>

          <h3 className="text-sm font-medium text-[#e5e5e5] mb-1.5">{current.title}</h3>
          <p className="text-[11px] text-[#666] leading-relaxed">{current.description}</p>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mt-3.5 mb-3.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 16 : 6,
                  background: i === step ? '#10b981' : i < step ? '#10b98155' : '#1a1a1a',
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-[10px] text-[#444] hover:text-[#888] uppercase tracking-widest transition-colors"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                disabled={step === 0}
                className="text-[10px] px-3 py-1.5 rounded border border-[#1a1a1a] text-[#666] hover:text-[#999] hover:border-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
              >
                Previous
              </button>
              <button
                onClick={next}
                className="text-[10px] px-3 py-1.5 rounded bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition-colors uppercase tracking-widest"
              >
                {isLast ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
