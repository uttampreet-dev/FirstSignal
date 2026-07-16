'use client'

import { Kicker } from './SectionHeading'
import { Reveal } from './Reveal'

const PILLARS = [
  {
    k: 'Inference',
    lines: [
      'Groq LPU · sub-second reasoning',
      'Six agents share one signal path',
      '740ms median message → action',
    ],
  },
  {
    k: 'Data',
    lines: [
      'Supabase Postgres · row-level security',
      'Your conversations are never training data',
      'Memory is per-customer and auditable',
    ],
  },
  {
    k: 'Channels',
    lines: [
      'Vapi outbound voice, browser-native',
      'Chat, email and order events in real time',
      'Next.js edge — nothing to install',
    ],
  },
]

export default function Foundation() {
  return (
    <section className="border-t border-[#141414] px-6 py-24 lg:px-14 lg:py-28">
      <Reveal>
        <Kicker index="07">Foundation</Kicker>
      </Reveal>

      <div className="mt-12 grid gap-10 border-t border-[#1a1a1a] pt-10 sm:grid-cols-3 sm:gap-6">
        {PILLARS.map((p, i) => (
          <Reveal key={p.k} delay={i * 0.08}>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#666]">{p.k}</p>
            <ul className="mt-5 space-y-2.5">
              {p.lines.map((l) => (
                <li key={l} className="flex items-baseline gap-2.5 text-[12.5px] leading-relaxed text-[#888]">
                  <span className="h-1 w-1 shrink-0 translate-y-[-2px] rounded-full bg-emerald-500/50" />
                  {l}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
