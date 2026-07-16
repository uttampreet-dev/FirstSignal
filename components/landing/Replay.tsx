'use client'

import SectionHeading from './SectionHeading'
import { Reveal } from './Reveal'
import LiveReplay from './LiveReplay'

export default function Replay() {
  return (
    <section id="live" className="scroll-mt-20 border-t border-[#141414] px-6 py-28 lg:px-14 lg:py-36">
      <SectionHeading
        index="04"
        kicker="Live run"
        lines={[<span key="l1">Six seconds. Zero humans.</span>]}
        lede="A real run, on loop. Watch the sentiment score collapse, the agents wake up, and Aria pull the customer back — while the action log fills itself in."
      />

      <Reveal delay={0.15} className="mt-16">
        <LiveReplay />
      </Reveal>
    </section>
  )
}
