'use client'

import { motion } from 'motion/react'

import { Kicker } from './SectionHeading'
import { Reveal, MaskLines } from './Reveal'
import { PrimaryCTA, SecondaryCTA } from './Button'

export default function Closing() {
  return (
    <>
      <section className="relative overflow-hidden border-t border-[#141414] px-6 py-32 lg:px-14 lg:py-44">
        {/* A faint horizon of signal under the closing line. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(70%_100%_at_50%_100%,rgba(16,185,129,0.07),transparent_70%)]"
        />

        {/* Echo of the hero radar — the sweep never stops. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-1/2 hidden h-140 w-140 -translate-y-1/2 lg:block"
        >
          <div className="absolute inset-0 rounded-full border border-[#141414]" />
          <div className="absolute inset-16 rounded-full border border-[#141414]" />
          <div className="absolute inset-32 rounded-full border border-[#141414]" />
          <div className="absolute inset-48 rounded-full border border-[#121212]" />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, rgba(16,185,129,0.10), transparent 70deg)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          />
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/70" />
        </div>

        <Reveal>
          <Kicker index="08">Enter</Kicker>
        </Reveal>

        <MaskLines
          className="mt-10 text-[clamp(2rem,5vw,4.4rem)] font-medium leading-[1.04] tracking-[-0.04em] text-[#f0f0f0]"
          lines={[
            <span key="l1">Somewhere in your inbox,</span>,
            <span key="l2">
              a churn is <span className="text-emerald-400">already forming</span>.
            </span>,
          ]}
        />

        <Reveal delay={0.25} className="mt-8 max-w-lg">
          <p className="text-[14px] leading-relaxed text-[#888]">
            The signal exists whether or not anyone is listening. FirstSignal is how you start
            listening — and how the problem is already fixed by the time you look.
          </p>
        </Reveal>

        <Reveal delay={0.4} className="relative mt-14 flex flex-wrap items-center gap-8">
          <PrimaryCTA href="/dashboard">View live dashboard</PrimaryCTA>
          <SecondaryCTA href="/chat">Talk to Aria</SecondaryCTA>
        </Reveal>
      </section>

      <footer className="flex flex-col gap-3 border-t border-[#141414] px-6 py-8 font-mono text-[9px] uppercase tracking-[0.2em] text-[#333] sm:flex-row sm:items-center sm:justify-between lg:px-14">
        <span>FirstSignal · Autonomous customer intelligence</span>
        <span>Groq · Supabase · Vapi · Next.js</span>
      </footer>
    </>
  )
}
