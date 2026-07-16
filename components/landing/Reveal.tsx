'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'motion/react'

/**
 * `immediate` plays on mount instead of on scroll. Hero content needs it: the
 * scroll trigger's negative viewport margin excludes the bottom of the screen,
 * where a full-height hero's copy lives, so it would never fire.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  immediate = false,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  immediate?: boolean
  className?: string
}) {
  const shown = { opacity: 1, y: 0 }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      {...(immediate
        ? { animate: shown }
        : { whileInView: shown, viewport: { once: true, margin: '-12% 0px' } })}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Lines of type that wipe up from behind a mask.
 *
 * The trigger lives on the unclipped parent: each line starts translated fully
 * below its own overflow-hidden wrapper, so an IntersectionObserver on the line
 * itself would be clipped to zero and never fire.
 */
export function MaskLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  immediate = false,
}: {
  lines: ReactNode[]
  className?: string
  lineClassName?: string
  delay?: number
  immediate?: boolean
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      {...(immediate
        ? { animate: 'show' }
        : { whileInView: 'show', viewport: { once: true, margin: '-10% 0px' } })}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            className={`block ${lineClassName ?? ''}`}
            variants={{ hidden: { y: '110%' }, show: { y: '0%' } }}
            transition={{ duration: 1, delay: delay + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.div>
  )
}

/** Counts to `to` when scrolled into view. Sits inline in prose, not in a card. */
export function Num({
  to,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: {
  to: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const value = useMotionValue(0)
  const spring = useSpring(value, { stiffness: 55, damping: 20, mass: 0.8 })
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (inView) value.set(to)
  }, [inView, to, value])

  useEffect(() => spring.on('change', (v) => setShown(v)), [spring])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  )
}
