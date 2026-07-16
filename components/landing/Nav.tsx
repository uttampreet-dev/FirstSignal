'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#agents', label: 'Agents' },
  { href: '#live', label: 'Live run' },
  { href: '#command', label: 'Command' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled
          ? 'border-b border-[#141414] bg-[#080808]/80 backdrop-blur-md'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="flex items-center justify-between px-6 py-4 lg:px-14" aria-label="Main">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50 [animation-duration:2.6s] motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#e5e5e5]">
            FirstSignal
          </span>
        </Link>

        <div className="hidden items-center gap-7 font-mono text-[10px] uppercase tracking-[0.18em] text-[#666] md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors duration-300 hover:text-[#e5e5e5]">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.18em]">
          <Link href="/chat" className="hidden text-[#666] transition-colors hover:text-[#e5e5e5] sm:block">
            Chat
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-emerald-500/25 px-3.5 py-1.5 text-emerald-400 transition-all duration-300 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:shadow-[0_0_24px_-8px_rgba(16,185,129,0.6)]"
          >
            Dashboard →
          </Link>
        </div>
      </nav>
    </header>
  )
}
