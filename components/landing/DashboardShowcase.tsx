'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

import SectionHeading from './SectionHeading'
import { Reveal } from './Reveal'

const ROWS = [
  { who: 'Priya S.', id: 'ORD-2847', state: 'Refund issued', score: 84, tone: '#10b981' },
  { who: 'Arjun M.', id: 'ORD-2811', state: 'Discount applied', score: 41, tone: '#f59e0b' },
  { who: 'Neha K.', id: 'ORD-2790', state: 'Watching', score: 68, tone: '#10b981' },
  { who: 'Rahul V.', id: 'ORD-2764', state: 'Proactive outreach', score: 29, tone: '#ef4444' },
]

const SPARK = 'M0,34 L30,30 L60,36 L90,26 L120,30 L150,22 L180,32 L210,18 L240,24 L270,12 L300,16'

function Ring({ score }: { score: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const tone = score > 60 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden>
      <circle cx="52" cy="52" r={r} fill="none" stroke="#1a1a1a" strokeWidth="7" />
      <circle
        cx="52"
        cy="52"
        r={r}
        fill="none"
        stroke={tone}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * circ} ${circ}`}
        transform="rotate(-90 52 52)"
        style={{ transition: 'all 0.8s ease' }}
      />
      <text x="52" y="49" textAnchor="middle" fill={tone} fontSize="20" fontWeight="600" fontFamily="var(--font-geist-mono), monospace">
        {score}
      </text>
      <text x="52" y="66" textAnchor="middle" fill="#555" fontSize="8" fontFamily="var(--font-geist-mono), monospace" letterSpacing="1">
        AT-RISK
      </text>
    </svg>
  )
}

/**
 * Not a screenshot — a living miniature of the real dashboard, with numbers
 * that drift the way the real feed does. The tilt follows the pointer.
 */
export default function DashboardShowcase() {
  const frame = useRef<HTMLDivElement>(null)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 100, damping: 24 })
  const sy = useSpring(my, { stiffness: 100, damping: 24 })
  const rotateY = useTransform(sx, [-0.5, 0.5], [5, -5])
  const rotateX = useTransform(sy, [-0.5, 0.5], [-3.5, 3.5])

  const [kpis, setKpis] = useState({ conv: 128, rate: 87, saved: 41.2, avg: 71 })
  const [ring, setRing] = useState(34)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setKpis((k) => ({
        conv: k.conv + (Math.random() < 0.4 ? 1 : 0),
        rate: 87,
        saved: +(k.saved + Math.random() * 0.3).toFixed(1),
        avg: Math.max(66, Math.min(76, k.avg + Math.round(Math.random() * 2 - 1))),
      }))
      setRing((r) => Math.max(22, Math.min(52, r + Math.round(Math.random() * 8 - 4))))
    }, 2200)
    return () => clearInterval(id)
  }, [])

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = frame.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  const KPIS = [
    { k: 'Conversations', v: String(kpis.conv) },
    { k: 'Auto-resolved', v: `${kpis.rate}%`, tone: '#10b981' },
    { k: 'Saved today', v: `₹${kpis.saved}k`, tone: '#10b981' },
    { k: 'Avg sentiment', v: String(kpis.avg) },
  ]

  return (
    <section id="command" className="scroll-mt-20 border-t border-[#141414] px-6 py-28 lg:px-14 lg:py-36">
      <SectionHeading
        index="05"
        kicker="Command surface"
        lines={[<span key="l1">The dashboard starts here.</span>]}
        lede="This panel is a living miniature of the real dashboard — the numbers drift the way the live feed does. The full surface is one click away, running on live data."
      />

      <div
        ref={frame}
        onMouseMove={onMove}
        onMouseLeave={() => {
          mx.set(0)
          my.set(0)
        }}
        className="relative mx-auto mt-20 max-w-4xl"
        style={{ perspective: '1600px' }}
      >
        {/* Light spilling off the surface */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-10 -bottom-10 top-1/2 blur-3xl"
        >
          <div className="h-full w-full bg-[radial-gradient(55%_50%_at_50%_50%,rgba(16,185,129,0.13),transparent_70%)]" />
        </div>

        <motion.div
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          className="relative overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] shadow-[0_60px_120px_-40px_rgba(0,0,0,0.9)]"
        >
          {/* Chrome */}
          <div className="flex items-center justify-between border-b border-[#141414] px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#888]">
                firstsignal · live dashboard
              </span>
            </div>
            <span className="font-mono text-[10px] tracking-[0.18em] text-[#444]">
              LIVE · 6 AGENTS
            </span>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 divide-x divide-[#141414] border-b border-[#141414] sm:grid-cols-4">
            {KPIS.map((k) => (
              <div key={k.k} className="px-5 py-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#444]">{k.k}</p>
                <p
                  className="mt-2 font-mono text-lg tracking-tight tabular-nums"
                  style={{ color: k.tone ?? '#e5e5e5' }}
                >
                  {k.v}
                </p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-5">
            {/* Feed */}
            <div className="sm:col-span-3 sm:border-r sm:border-[#141414]">
              <div className="border-b border-[#141414] p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#444]">
                  Sentiment · last hour
                </p>
                <svg viewBox="0 0 300 44" className="mt-3 h-11 w-full overflow-visible" aria-hidden>
                  <path d={SPARK} fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.85" />
                  <circle cx="300" cy="16" r="2.5" fill="#10b981">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
              <div className="divide-y divide-[#141414]">
                {ROWS.map((row) => (
                  <div key={row.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-[11px] text-[#bbb]">{row.who}</p>
                      <p className="font-mono text-[9px] tracking-wider text-[#444]">{row.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[13px] tabular-nums" style={{ color: row.tone }}>
                        {row.score}
                      </p>
                      <p className="font-mono text-[9px] tracking-wider text-[#444]">{row.state}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ring + agents */}
            <div className="flex flex-col sm:col-span-2">
              <div className="flex flex-1 flex-col items-center justify-center border-b border-[#141414] p-5">
                <Ring score={ring} />
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#444]">
                  Most at-risk account
                </p>
              </div>
              <div className="p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#444]">
                  Agents nominal
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Sentiment', 'Memory', 'Retention', 'Resolution', 'Proactive', 'Voice'].map((a) => (
                    <span
                      key={a}
                      className="flex items-center gap-1.5 rounded border border-[#1a1a1a] bg-[#0a0a0a] px-2 py-1 font-mono text-[9px] text-[#666]"
                    >
                      <span className="h-1 w-1 rounded-full bg-emerald-500/70" />
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Reveal delay={0.2} className="mt-12 text-center">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Open the real thing
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
      </Reveal>
    </section>
  )
}
