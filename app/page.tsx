'use client'

import { MotionConfig, motion, useScroll, useSpring } from 'motion/react'

import Nav from '@/components/landing/Nav'
import Hero from '@/components/landing/Hero'
import SignalSources from '@/components/landing/SignalSources'
import TimelineFork from '@/components/landing/TimelineFork'
import HowItWorks from '@/components/landing/HowItWorks'
import AgentRail from '@/components/landing/AgentRail'
import Replay from '@/components/landing/Replay'
import DashboardShowcase from '@/components/landing/DashboardShowcase'
import Proof from '@/components/landing/Proof'
import Foundation from '@/components/landing/Foundation'
import Closing from '@/components/landing/Closing'

export default function Home() {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative bg-[#080808] text-[#e5e5e5] antialiased">
        {/* Scroll progress — a hairline, not a bar */}
        <motion.div
          aria-hidden
          style={{ scaleX: progress }}
          className="fixed inset-x-0 top-0 z-60 h-px origin-left bg-emerald-500"
        />

        {/* Film grain, shared with the dashboard's surface feel */}
        <div className="pointer-events-none fixed inset-0 z-40 grain" aria-hidden />

        <Nav />

        <main>
          <Hero />
          <SignalSources />
          <TimelineFork />
          <HowItWorks />
          <AgentRail />
          <Replay />
          <DashboardShowcase />
          <Proof />
          <Foundation />
          <Closing />
        </main>
      </div>
    </MotionConfig>
  )
}
