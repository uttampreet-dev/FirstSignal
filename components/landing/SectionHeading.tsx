'use client'

import type { ReactNode } from 'react'
import { Reveal, MaskLines } from './Reveal'

export function Kicker({ index, children }: { index: string; children: string }) {
  return (
    <div className="flex items-baseline gap-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#555]">
      <span className="text-emerald-500/60">{index}</span>
      <span>{children}</span>
      <span className="hidden h-px w-16 self-center bg-[#1a1a1a] sm:block" />
    </div>
  )
}

/**
 * Shared section opener: kicker + headline left, lede right.
 * Every section speaks with the same voice so the page reads as one system.
 */
export default function SectionHeading({
  index,
  kicker,
  lines,
  lede,
}: {
  index: string
  kicker: string
  lines: ReactNode[]
  lede: string
}) {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <Reveal>
          <Kicker index={index}>{kicker}</Kicker>
        </Reveal>
        <MaskLines
          className="mt-8 max-w-2xl text-[clamp(1.6rem,2.9vw,2.6rem)] font-medium leading-[1.14] tracking-[-0.03em] text-[#eee]"
          lines={lines}
        />
      </div>
      <Reveal delay={0.15} className="lg:pb-2">
        <p className="max-w-sm text-[14px] leading-relaxed text-[#888]">{lede}</p>
      </Reveal>
    </div>
  )
}
