'use client'

import Link from 'next/link'
import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

/**
 * Magnetic hover: the button leans a few pixels toward the cursor and snaps
 * back on leave. Subtle by design — a pull, not a chase.
 */
function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 240, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 240, damping: 18, mass: 0.4 })

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    x.set((e.clientX - (r.left + r.width / 2)) * 0.18)
    y.set((e.clientY - (r.top + r.height / 2)) * 0.28)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
      style={{ x: sx, y: sy }}
      className="inline-block"
    >
      {children}
    </motion.div>
  )
}

/** Solid emerald — the same primary the dashboard and chat use. */
export function PrimaryCTA({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Magnetic>
      <Link
        href={href}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-emerald-500 px-5 py-2.5 text-[12px] font-medium tracking-wide text-black transition-[background-color,box-shadow] duration-300 hover:bg-emerald-400 hover:shadow-[0_0_36px_-6px_rgba(16,185,129,0.75)]"
      >
        {/* Sheen sweep on hover */}
        <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
        <span className="relative">{children}</span>
        <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">→</span>
      </Link>
    </Magnetic>
  )
}

export function SecondaryCTA({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Magnetic>
      <Link
        href={href}
        className="group inline-flex items-center gap-2 rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] px-5 py-2.5 text-[12px] tracking-wide text-[#888] transition-[border-color,background-color,color] duration-300 hover:border-emerald-500/30 hover:bg-[#0f1a14] hover:text-[#e5e5e5]"
      >
        {children}
        <span className="text-emerald-500 transition-transform duration-300 group-hover:translate-x-0.5">→</span>
      </Link>
    </Magnetic>
  )
}
