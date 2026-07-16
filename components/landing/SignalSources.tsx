'use client'

const SOURCES = [
  'Live chat',
  'Email threads',
  'Support tickets',
  'Order events',
  'Voice calls',
  'Product reviews',
  'Reddit',
  'Discord',
  'CRM notes',
  'Social mentions',
]

/**
 * A thin instrument band under the hero: every channel the system listens to,
 * moving like a feed — not a logo wall.
 */
export default function SignalSources() {
  return (
    <section
      aria-label="Channels FirstSignal monitors"
      className="flex items-center gap-6 overflow-hidden border-y border-[#141414] px-6 py-4 lg:px-14"
    >
      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.24em] text-[#444]">
        Listening across
      </span>

      <div
        className="relative flex-1 overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <div className="flex w-max animate-scroll gap-10 whitespace-nowrap motion-reduce:animate-none">
          {[...SOURCES, ...SOURCES].map((s, i) => (
            <span
              key={i}
              className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#555]"
              aria-hidden={i >= SOURCES.length}
            >
              <span className="h-1 w-1 rounded-full bg-emerald-500/50" />
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
