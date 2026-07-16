'use client'

import { useRef, useState } from 'react'
import { motion, useScroll, useSpring, useTransform, useMotionValueEvent } from 'motion/react'

import { Kicker } from './SectionHeading'

const DAYS = [
  { day: 0, x: 60, label: 'Order placed' },
  { day: 2, x: 280, label: 'Delivery slips · silence' },
  { day: 4, x: 500, label: 'Frustration forms' },
  { day: 6, x: 720, label: 'First angry message' },
  { day: 8, x: 940, label: 'Refund demanded' },
]

// The unwatched customer: sentiment decays for a week, then churns.
const PATH_CHURN = 'M60,70 C240,86 380,116 500,150 C640,196 790,238 940,264'
// The watched one: identical until day 4, where FirstSignal intervenes and the line forks up.
const PATH_SAVED = 'M500,150 C580,172 640,158 710,120 C790,78 870,64 940,60'

export default function TimelineFork() {
  const ref = useRef<HTMLDivElement>(null)
  const [day, setDay] = useState(0)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.5 })

  const churnLength = useTransform(p, [0.08, 0.66], [0, 1])
  const savedLength = useTransform(p, [0.5, 0.88], [0, 1])
  const forkMark = useTransform(p, [0.48, 0.56], [0, 1])
  const churnEnd = useTransform(p, [0.64, 0.72], [0, 1])
  const savedEnd = useTransform(p, [0.86, 0.94], [0, 1])

  const dayValue = useTransform(p, [0.08, 0.88], [0, 8])
  useMotionValueEvent(dayValue, 'change', (v) => {
    const next = Math.min(8, Math.max(0, Math.round(v)))
    setDay((prev) => (prev === next ? prev : next))
  })

  return (
    <div ref={ref} className="relative h-[280vh]">
      <div className="sticky top-0 flex h-svh min-h-160 flex-col justify-center px-6 lg:px-14">
        <div className="flex items-end justify-between gap-8">
          <div>
            <Kicker index="01">The gap</Kicker>
            <h2 className="mt-7 max-w-2xl text-[clamp(1.6rem,2.9vw,2.6rem)] font-medium leading-[1.14] tracking-[-0.03em] text-[#eee]">
              A ticket is the last symptom.
              <br />
              The same customer, <span className="text-emerald-400">two futures</span>.
            </h2>
          </div>

          {/* The clock the scroll is winding forward. */}
          <div className="hidden shrink-0 text-right sm:block" aria-hidden>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#444]">
              Days since order
            </p>
            <p className="mt-1 font-mono text-5xl leading-none tracking-tight tabular-nums text-[#e5e5e5]">
              {day}
            </p>
          </div>
        </div>

        <p className="mt-5 max-w-xl text-[13px] leading-relaxed text-[#777]">
          By the time a customer types a complaint, they have been silently unhappy for days.
          Scroll the week forward and watch the moment where the two outcomes split.
        </p>

        {/* Compact clock for viewports where the big counter is hidden. */}
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#555] sm:hidden" aria-hidden>
          Day <span className="text-[#e5e5e5]">{day}</span> of 8
        </p>

        <div className="mt-12">
          <svg viewBox="0 0 1000 320" className="w-full overflow-visible" role="img" aria-label="Sentiment timeline: without FirstSignal the customer churns by day 8; with FirstSignal the decline is caught at day 4 and recovered.">
            {/* Grid */}
            {[70, 150, 230].map((y) => (
              <line key={y} x1="60" y1={y} x2="940" y2={y} stroke="#121212" strokeWidth="1" />
            ))}
            <line x1="60" y1="290" x2="940" y2="290" stroke="#1a1a1a" strokeWidth="1" />

            {/* Day ticks */}
            {DAYS.map((d) => (
              <g key={d.day}>
                <line x1={d.x} y1="290" x2={d.x} y2="297" stroke="#333" strokeWidth="1" />
                <text
                  x={d.x}
                  y="313"
                  fill={day >= d.day ? '#888' : '#3a3a3a'}
                  fontSize="10"
                  letterSpacing="2"
                  textAnchor={d.x === 940 ? 'end' : d.x === 60 ? 'start' : 'middle'}
                  fontFamily="var(--font-geist-mono), monospace"
                  style={{ transition: 'fill 0.4s' }}
                >
                  DAY {d.day}
                </text>
                <text
                  x={d.x}
                  y="329"
                  fill={day >= d.day ? '#555' : '#262626'}
                  fontSize="9.5"
                  textAnchor={d.x === 940 ? 'end' : d.x === 60 ? 'start' : 'middle'}
                  fontFamily="var(--font-geist-sans), sans-serif"
                  style={{ transition: 'fill 0.4s' }}
                >
                  {d.label}
                </text>
              </g>
            ))}

            {/* Without FirstSignal — the decay everyone ships today */}
            <motion.path
              d={PATH_CHURN}
              fill="none"
              stroke="url(#churn)"
              strokeWidth="1.75"
              style={{ pathLength: churnLength }}
            />
            {/* With FirstSignal — the fork */}
            <motion.path
              d={PATH_SAVED}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.75"
              style={{ pathLength: savedLength }}
            />

            <defs>
              <linearGradient id="churn" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="45%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>

            {/* Intervention marker at the fork */}
            <motion.g style={{ opacity: forkMark }}>
              <line
                x1="500"
                y1="40"
                x2="500"
                y2="290"
                stroke="rgba(16,185,129,0.45)"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
              <circle cx="500" cy="150" r="4" fill="#10b981" />
              <text
                x="490"
                y="52"
                fill="#10b981"
                fontSize="9.5"
                letterSpacing="1.6"
                textAnchor="end"
                fontFamily="var(--font-geist-mono), monospace"
              >
                FIRSTSIGNAL INTERVENES · DAY 4
              </text>
            </motion.g>

            {/* Outcomes */}
            <motion.g style={{ opacity: churnEnd }}>
              <circle cx="940" cy="264" r="3.5" fill="#ef4444" />
              <text
                x="940"
                y="252"
                fill="#ef4444"
                fontSize="9.5"
                letterSpacing="1.6"
                textAnchor="end"
                fontFamily="var(--font-geist-mono), monospace"
              >
                UNWATCHED · CHURNED
              </text>
            </motion.g>
            <motion.g style={{ opacity: savedEnd }}>
              <circle cx="940" cy="60" r="3.5" fill="#10b981" />
              <text
                x="940"
                y="48"
                fill="#10b981"
                fontSize="9.5"
                letterSpacing="1.6"
                textAnchor="end"
                fontFamily="var(--font-geist-mono), monospace"
              >
                RETAINED · SENTIMENT 84 · LTV ₹41,200
              </text>
            </motion.g>
          </svg>
        </div>
      </div>
    </div>
  )
}
