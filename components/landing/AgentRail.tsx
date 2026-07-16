'use client'

import { useRef } from 'react'
import { motion, useScroll, useSpring } from 'motion/react'

import SectionHeading from './SectionHeading'
import { Reveal } from './Reveal'

const AGENTS = [
  {
    i: '01',
    name: 'Sentiment',
    fn: 'Scores every message 0–100 as it arrives — tone and urgency, not keywords.',
    consumes: 'message',
    emits: 'score',
    tone: '#ef4444',
  },
  {
    i: '02',
    name: 'Memory',
    fn: 'Recalls every past order, complaint and apology this customer has ever had.',
    consumes: 'score',
    emits: 'context',
    tone: '#3b82f6',
  },
  {
    i: '03',
    name: 'Retention',
    fn: 'Predicts churn before it lands and weighs lifetime value against the risk.',
    consumes: 'context',
    emits: 'risk',
    tone: '#f59e0b',
  },
  {
    i: '04',
    name: 'Resolution',
    fn: 'Refunds, discounts, redelivery — executed against real systems, not suggested.',
    consumes: 'risk',
    emits: 'action',
    tone: '#10b981',
  },
  {
    i: '05',
    name: 'Proactive',
    fn: 'Reaches out before the customer even notices something broke.',
    consumes: 'risk',
    emits: 'outreach',
    tone: '#3b82f6',
  },
  {
    i: '06',
    name: 'Voice',
    fn: 'Places a real outbound call when text is no longer enough.',
    consumes: 'action',
    emits: 'call',
    tone: '#10b981',
  },
]

export default function AgentRail() {
  const rail = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: rail,
    offset: ['start 0.8', 'end 0.55'],
  })
  const drawn = useSpring(scrollYProgress, { stiffness: 80, damping: 26, mass: 0.6 })

  return (
    <section id="agents" className="scroll-mt-20 border-t border-[#141414] px-6 py-28 lg:px-14 lg:py-36">
      <SectionHeading
        index="03"
        kicker="The agents"
        lines={[
          <span key="l1">Six agents on one spine.</span>,
          <span key="l2">Each consumes what the last emits.</span>,
        ]}
        lede="No orchestration theatre. A message enters at the top, and by the bottom of the spine an action has already happened. The line below draws as the signal travels."
      />

      <div ref={rail} className="relative mx-auto mt-24 max-w-5xl">
        {/* The spine — drawn by scroll, exactly as far as you've read. */}
        <div className="absolute inset-y-0 left-4 w-px bg-[#161616] lg:left-1/2" aria-hidden>
          <motion.div
            className="h-full w-px origin-top bg-linear-to-b from-emerald-500 via-emerald-500/70 to-emerald-500/30"
            style={{ scaleY: drawn }}
          />
        </div>

        <div className="space-y-4 lg:space-y-0">
          {AGENTS.map((a, idx) => {
            const left = idx % 2 === 0
            return (
              <div key={a.i} className="relative lg:grid lg:grid-cols-2">
                {/* Node on the spine */}
                <span
                  aria-hidden
                  className="absolute left-4 top-9 z-10 flex h-2.5 w-2.5 -translate-x-1/2 items-center justify-center lg:left-1/2 lg:top-14"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border-2 border-[#080808]"
                    style={{ background: a.tone }}
                  />
                </span>

                <Reveal
                  delay={0.08}
                  className={`py-6 pl-12 lg:py-10 ${
                    left
                      ? 'lg:col-start-1 lg:pl-0 lg:pr-16 lg:text-right'
                      : 'lg:col-start-2 lg:pl-16'
                  }`}
                >
                  <div
                    className={`flex items-baseline gap-4 ${left ? 'lg:justify-end' : ''}`}
                  >
                    <span className="font-mono text-[10px] tracking-[0.2em] text-[#333]">
                      {a.i}
                    </span>
                    <h3 className="text-[17px] font-medium tracking-tight" style={{ color: a.tone }}>
                      {a.name} <span className="text-[#555]">Agent</span>
                    </h3>
                  </div>
                  <p
                    className={`mt-3 max-w-sm text-[13px] leading-relaxed text-[#888] ${
                      left ? 'lg:ml-auto' : ''
                    }`}
                  >
                    {a.fn}
                  </p>
                  <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#444]">
                    consumes <span className="text-[#777]">{a.consumes}</span>
                    <span className="mx-2 text-emerald-500/60">→</span>
                    emits <span className="text-[#777]">{a.emits}</span>
                  </p>
                </Reveal>
              </div>
            )
          })}
        </div>

        {/* Where the spine terminates: an outcome, not a diagram. */}
        <Reveal className="relative mt-4 pl-12 lg:mt-10 lg:pl-0 lg:text-center">
          <span
            aria-hidden
            className="absolute -top-1 left-4 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-emerald-500 shadow-[0_0_18px_2px_rgba(16,185,129,0.5)] lg:left-1/2"
          />
          <p className="pt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-500">
            Customer made whole · memory updated · zero human minutes
          </p>
        </Reveal>
      </div>
    </section>
  )
}
