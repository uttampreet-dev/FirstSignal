'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

import SectionHeading from './SectionHeading'

const STEPS = [
  {
    i: '01',
    title: 'Detect',
    h: 'Hear frustration while it is still quiet',
    body:
      'Every message is scored 0–100 the moment it arrives. Not keywords — tone, urgency and history. A polite “any update?” from a customer whose last two orders ran late reads very differently from the same words typed by a happy one.',
  },
  {
    i: '02',
    title: 'Diagnose',
    h: 'Explain what changed, and why',
    body:
      'Memory and retention agents assemble the full picture: who this customer is, what broke, and whether it is one incident or a pattern spreading across accounts. The output is a cause, not a chart.',
  },
  {
    i: '03',
    title: 'Act',
    h: 'Fix it before anyone files a ticket',
    body:
      'Refunds, redelivery, credits, an outbound voice call when text is not enough — executed autonomously in under a second, then written back to memory so the system never apologises for the same thing twice.',
  },
]

/** Steps through 0..steps then holds and wraps — drives each looping panel. */
function useLoopStep(steps: number, ms: number) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % (steps + 2)), ms)
    return () => clearInterval(id)
  }, [steps, ms])
  return step
}

function PanelChrome({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0d0d0d]">
      <div className="flex items-center justify-between border-b border-[#141414] px-5 py-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-500">
          {label}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500 motion-reduce:animate-none" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#444]">Live</span>
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

const DETECT_FEED = [
  { who: 'Rohan M.', text: 'hey — any update on ORD-3102?', score: 71 },
  { who: 'Sana K.', text: 'loved the packaging btw, ordering again', score: 88 },
  { who: 'Priya S.', text: 'where is my order?? it has been 6 days', score: 22 },
]

function scoreTone(s: number) {
  if (s < 30) return '#ef4444'
  if (s < 60) return '#f59e0b'
  return '#10b981'
}

function DetectPanel() {
  const step = useLoopStep(DETECT_FEED.length + 1, 1400)
  return (
    <PanelChrome label="Inbound stream">
      <div className="min-h-52 space-y-3">
        {DETECT_FEED.slice(0, Math.min(step, DETECT_FEED.length)).map((m, i) => (
          <div key={i} className="animate-stepin flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[9px] tracking-wider text-[#444]">{m.who}</p>
              <p className="mt-0.5 truncate text-[12px] text-[#999]">{m.text}</p>
            </div>
            <span
              className="shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] tabular-nums"
              style={{
                color: scoreTone(m.score),
                borderColor: `${scoreTone(m.score)}33`,
                background: `${scoreTone(m.score)}0d`,
              }}
            >
              {m.score}
            </span>
          </div>
        ))}
        {step > DETECT_FEED.length && (
          <div className="animate-stepin flex items-center gap-3 pt-1">
            <div className="h-px flex-1 bg-[#1a1a1a]" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#ef4444]">
              flagged · frustration forming · watch active
            </span>
            <div className="h-px flex-1 bg-[#1a1a1a]" />
          </div>
        )}
      </div>
    </PanelChrome>
  )
}

const TRACE = [
  { k: 'sentiment', v: '22/100 · anger + urgency · confidence 0.94', tone: '#ef4444' },
  { k: 'memory', v: '3 orders · 2 delivered late · ₹41,200 lifetime', tone: '#888' },
  { k: 'order', v: 'ORD-2847 · stuck 72h at Pune hub', tone: '#888' },
  { k: 'pattern', v: '14 customers on the same courier lane', tone: '#f59e0b' },
  { k: 'root cause', v: 'courier delay — not product, not pricing', tone: '#10b981' },
]

function DiagnosePanel() {
  const step = useLoopStep(TRACE.length, 1100)
  return (
    <PanelChrome label="Reasoning trace">
      <div className="min-h-52 space-y-2.5 font-mono text-[10.5px] leading-relaxed">
        {TRACE.slice(0, step).map((t, i) => (
          <p key={i} className="animate-stepin flex gap-3">
            <span className="w-20 shrink-0 uppercase tracking-wider text-[#444]">
              {i === TRACE.length - 1 ? '└─' : '├─'} {t.k}
            </span>
            <span style={{ color: t.tone }}>{t.v}</span>
          </p>
        ))}
        {step === 0 && <p className="text-[#333]">assembling context…</p>}
      </div>
    </PanelChrome>
  )
}

const ACTIONS = [
  { a: 'Priority redispatch', r: 'confirmed with carrier', ms: '320ms' },
  { a: '15% apology credit', r: 'SORRY15-XK2PQ applied', ms: '480ms' },
  { a: 'Voice callback', r: 'queued · Aria via Vapi', ms: '740ms' },
]

function ActPanel() {
  const step = useLoopStep(ACTIONS.length + 1, 1300)
  const recovered = step > ACTIONS.length
  return (
    <PanelChrome label="Actions fired">
      <div className="min-h-52">
        <div className="space-y-2.5">
          {ACTIONS.slice(0, Math.min(step, ACTIONS.length)).map((a, i) => (
            <div
              key={i}
              className="animate-stepin flex items-center justify-between rounded border border-emerald-500/10 bg-emerald-500/5 px-3 py-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-emerald-500">✓</span>
                <span className="text-[11.5px] text-[#bbb]">{a.a}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden font-mono text-[9px] text-[#555] sm:block">{a.r}</span>
                <span className="font-mono text-[9px] tabular-nums text-emerald-500/70">{a.ms}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-[#141414] pt-4">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#444]">
              Sentiment
            </span>
            <span
              className="font-mono text-sm tabular-nums transition-colors duration-700"
              style={{ color: recovered ? '#10b981' : '#ef4444' }}
            >
              {recovered ? '22 → 84' : '22'}
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#1a1a1a]">
            <div
              className="h-1 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: recovered ? '84%' : '22%',
                background: recovered ? '#10b981' : '#ef4444',
              }}
            />
          </div>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#333]">
            Human minutes: 0
          </p>
        </div>
      </div>
    </PanelChrome>
  )
}

const PANELS = [DetectPanel, DiagnosePanel, ActPanel]

export default function HowItWorks() {
  const [active, setActive] = useState(0)

  return (
    <section id="how" className="scroll-mt-20 border-t border-[#141414] px-6 pt-28 lg:px-14 lg:pt-36">
      <SectionHeading
        index="02"
        kicker="How it works"
        lines={[<span key="l1">Detect. Diagnose. Act.</span>, <span key="l2">In that order, in seconds.</span>]}
        lede="One pass through the system, shown live. The panels on the right are running the same choreography the product runs on real conversations."
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-20">
        {/* Steps — each block hands the sticky panel its scene as it enters. */}
        <div>
          {STEPS.map((s, i) => {
            const Panel = PANELS[i]
            return (
              <motion.div
                key={s.i}
                onViewportEnter={() => setActive(i)}
                viewport={{ amount: 0.5 }}
                className="flex min-h-[70vh] flex-col justify-center py-16 lg:min-h-[88vh]"
              >
                <div className="flex items-baseline gap-5">
                  <span
                    className={`font-mono text-[11px] tracking-[0.2em] transition-colors duration-500 ${
                      active === i ? 'text-emerald-500' : 'text-[#333]'
                    }`}
                  >
                    {s.i}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#555]">
                    {s.title}
                  </span>
                </div>
                <h3 className="mt-6 max-w-md text-[clamp(1.3rem,2.2vw,1.9rem)] font-medium leading-[1.2] tracking-[-0.02em] text-[#eee]">
                  {s.h}
                </h3>
                <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-[#888]">{s.body}</p>

                {/* On small screens the panel lives with its step. */}
                <div className="mt-10 lg:hidden">
                  <Panel />
                </div>
              </motion.div>
            )
          })}
          {/* Room for the sticky stage to stay centred while the last step is read. */}
          <div aria-hidden className="hidden lg:block lg:h-[35vh]" />
        </div>

        {/* Sticky stage — panels crossfade as the copy scrolls past. */}
        <div className="hidden lg:block">
          <div className="sticky top-0 flex h-svh items-center">
            <div className="relative w-full">
              {PANELS.map((Panel, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{
                    opacity: active === i ? 1 : 0,
                    y: active === i ? 0 : active > i ? -24 : 24,
                    scale: active === i ? 1 : 0.97,
                  }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className={i === 0 ? 'relative' : 'absolute inset-0 flex items-center'}
                  style={{ pointerEvents: active === i ? 'auto' : 'none' }}
                >
                  <div className="w-full">
                    <Panel />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
