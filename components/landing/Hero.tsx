'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'motion/react'

import type { RadarPhase, RadarState } from './RadarField'
import { Reveal, MaskLines } from './Reveal'
import { PrimaryCTA, SecondaryCTA } from './Button'

const RadarField = dynamic(() => import('./RadarField'), { ssr: false })

const PHASE_TONE: Record<RadarPhase, string> = {
  nominal: '#10b981',
  degrading: '#f59e0b',
  detected: '#ef4444',
  resolved: '#10b981',
}

const PHASE_LINE: Record<RadarPhase, (s: RadarState) => string> = {
  nominal: (s) => `sweep complete · 3,200 signals · sector ${s.sector} nominal`,
  degrading: (s) => `sector ${s.sector} slipping · sentiment ${s.score}/100 · watching`,
  detected: (s) => `anomaly isolated · sector ${s.sector} · dispatching resolution`,
  resolved: (s) => `resolved autonomously · sentiment ${s.score} · human minutes 0`,
}

function scoreTone(score: number) {
  if (score < 30) return '#ef4444'
  if (score < 60) return '#f59e0b'
  return '#10b981'
}

/** Terminal-style feed the radar writes into as its phases change. */
function EventFeed({ state }: { state: RadarState }) {
  const [lines, setLines] = useState<{ id: number; at: string; text: string; tone: string }[]>([])
  const lastPhase = useRef<RadarPhase | null>(null)
  const id = useRef(0)

  useEffect(() => {
    if (state.phase === lastPhase.current) return
    lastPhase.current = state.phase
    const at = new Date().toLocaleTimeString('en-GB', { hour12: false })
    setLines((prev) =>
      [
        ...prev,
        {
          id: id.current++,
          at,
          text: PHASE_LINE[state.phase](state),
          tone: PHASE_TONE[state.phase],
        },
      ].slice(-4)
    )
  }, [state])

  return (
    <div className="w-full max-w-sm border-t border-[#1a1a1a] pt-4" aria-hidden>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#444]">
          System feed
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500 motion-reduce:animate-none" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#444]">Live</span>
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        <AnimatePresence initial={false}>
          {lines.map((l, i) => (
            <motion.p
              key={l.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: i === lines.length - 1 ? 1 : 0.45 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.35 }}
              className="flex gap-3 font-mono text-[10px] leading-relaxed"
            >
              <span className="shrink-0 text-[#333]">{l.at}</span>
              <span style={{ color: i === lines.length - 1 ? l.tone : '#666' }}>{l.text}</span>
            </motion.p>
          ))}
        </AnimatePresence>
        {lines.length === 0 && (
          <p className="font-mono text-[10px] text-[#333]">initialising field…</p>
        )}
      </div>
    </div>
  )
}

export default function Hero() {
  const [state, setState] = useState<RadarState>({
    phase: 'nominal',
    score: 78,
    sector: 12,
  })

  const atRisk = state.phase === 'degrading' || state.phase === 'detected' ? 7 : 6

  const telemetry = [
    {
      k: 'Watched account · sentiment',
      v: String(state.score),
      tone: scoreTone(state.score),
    },
    { k: 'At-risk right now', v: String(atRisk), tone: atRisk > 6 ? '#f59e0b' : '#e5e5e5' },
    { k: 'Median time-to-action', v: '740ms', tone: '#e5e5e5' },
    { k: 'Resolved without a human', v: '87%', tone: '#e5e5e5' },
  ]

  return (
    <section className="relative flex h-svh min-h-180 w-full flex-col overflow-hidden">
      <div className="absolute inset-0" aria-hidden>
        <RadarField onState={setState} />
      </div>

      {/* Grade the canvas into the page — no visible seam. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-[#080808] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#080808] to-transparent" />

      <div className="relative z-10 flex flex-1 flex-col justify-end px-6 pb-10 lg:px-14">
        <div className="grid items-end gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal immediate delay={0.1}>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-500/80">
                Autonomous customer intelligence
              </p>
            </Reveal>

            <MaskLines
              immediate
              delay={0.25}
              className="mt-6 text-[clamp(2.1rem,4.2vw,3.9rem)] font-medium leading-[1.06] tracking-[-0.04em] text-[#f0f0f0]"
              lines={[
                <>Churn doesn&rsquo;t start</>,
                <>with a ticket.</>,
                <>
                  It starts with a <span className="text-emerald-400">signal</span>.
                </>,
              ]}
            />

            <Reveal immediate delay={0.55} className="mt-7 max-w-xl">
              <p className="text-[14px] leading-relaxed text-[#888]">
                FirstSignal watches every conversation as it happens — scores the frustration
                inside it, isolates the cause, and resolves it autonomously. Before the ticket.
                Before the refund request. Before the goodbye.
              </p>
            </Reveal>

            <Reveal immediate delay={0.7} className="mt-9 flex flex-wrap items-center gap-6">
              <PrimaryCTA href="/dashboard">View live dashboard</PrimaryCTA>
              <SecondaryCTA href="/chat">Talk to Aria</SecondaryCTA>
            </Reveal>
          </div>

          <Reveal immediate delay={0.9} className="hidden lg:col-span-5 lg:flex lg:justify-end">
            <EventFeed state={state} />
          </Reveal>
        </div>
      </div>

      {/* Instrument bar — the dashboard starts here. */}
      <Reveal immediate delay={1.05} className="relative z-10">
        <div className="grid grid-cols-2 divide-x divide-[#141414] border-t border-[#141414] bg-[#080808]/60 backdrop-blur-sm lg:grid-cols-4">
          {telemetry.map((t) => (
            <div key={t.k} className="px-6 py-4 lg:px-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#444]">{t.k}</p>
              <p
                className="mt-1.5 font-mono text-lg leading-none tracking-tight tabular-nums transition-colors duration-300"
                style={{ color: t.tone }}
              >
                {t.v}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
