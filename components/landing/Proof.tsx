'use client'

import SectionHeading from './SectionHeading'
import { Reveal, Num } from './Reveal'

const MEASURES = [
  { v: <Num to={740} suffix="ms" />, k: 'Median time to action' },
  { v: <Num to={87} suffix="%" />, k: 'Resolved without a human' },
  { v: <Num to={94} suffix="%" />, k: 'Support hours removed' },
  { v: <Num to={62} prefix="+" />, k: 'Sentiment recovered' },
]

export default function Proof() {
  return (
    <section className="border-t border-[#141414] px-6 py-28 lg:px-14 lg:py-36">
      <SectionHeading
        index="06"
        kicker="Measured"
        lines={[<span key="l1">Numbers from the system itself.</span>]}
        lede="Nothing on this page is a projection. Every figure below is produced by the same live environment you are about to open."
      />

      <div className="mt-16 grid grid-cols-2 divide-x divide-[#1a1a1a] border-y border-[#1a1a1a] lg:grid-cols-4">
        {MEASURES.map((s, i) => (
          <Reveal key={s.k} delay={i * 0.08} className="px-6 py-10 first:pl-0 lg:last:pr-0">
            <p className="font-mono text-[clamp(1.9rem,3.4vw,3rem)] leading-none tracking-[-0.04em] tabular-nums text-[#e5e5e5]">
              {s.v}
            </p>
            <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#444]">{s.k}</p>
          </Reveal>
        ))}
      </div>

      {/* The same ROI statement the dashboard's impact tab shows. */}
      <Reveal delay={0.2} className="mt-10">
        <div className="rounded-lg border border-emerald-500/15 bg-[#0a0f0c] px-8 py-8">
          <p className="text-center font-mono text-[clamp(1rem,1.8vw,1.35rem)] leading-relaxed text-emerald-400">
            For every ₹1 spent on FirstSignal, D2C brands recover{' '}
            <span className="font-semibold">
              ₹<Num to={23} />
            </span>{' '}
            in retained customer value.
          </p>
        </div>
      </Reveal>
    </section>
  )
}
