'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const DEMO_MESSAGES = [
  { role: 'customer', name: 'Priya S.', text: 'where is my order its been 6 days', delay: 0 },
  { role: 'system', text: 'Sentiment detected: FRUSTRATED · Score: 22/100', delay: 1200 },
  { role: 'aria', text: 'Priya, I can see your order ORD-2847 is delayed — I\'m escalating this to priority right now and applying a 15% apology discount to your account.', delay: 2200 },
  { role: 'system', text: 'Action fired: apply_discount → SORRY15-XK2PQ · Memory updated', delay: 3400 },
  { role: 'customer', name: 'Priya S.', text: 'I needed this for my wedding next week this is unacceptable', delay: 4600 },
  { role: 'system', text: 'Churn risk: HIGH · Escalation triggered · Voice callback initiated', delay: 5800 },
  { role: 'aria', text: 'I\'ve flagged this as urgent — wedding deadline. Express redelivery confirmed. Aria is calling you now to personally resolve this.', delay: 6800 },
  { role: 'system', text: 'Refund ID: REF-1780042847773 · Issue resolved · Human time saved: 0min', delay: 8000 },
]

function TypewriterText({ text, speed = 18 }: { text: string, speed?: number }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text])
  return <>{displayed}</>
}

export default function Home() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([])
  const [loopKey, setLoopKey] = useState(0)

  useEffect(() => {
    setVisibleMessages([])
    const timers: NodeJS.Timeout[] = []
    DEMO_MESSAGES.forEach((msg, i) => {
      const t = setTimeout(() => {
        setVisibleMessages(prev => [...prev, i])
      }, msg.delay)
      timers.push(t)
    })
    const loop = setTimeout(() => {
      setLoopKey(k => k + 1)
    }, 11000)
    timers.push(loop)
    return () => timers.forEach(clearTimeout)
  }, [loopKey])

  return (
    <div className="min-h-screen bg-[#080808] text-[#e5e5e5] flex flex-col overflow-hidden" style={{fontFamily:'monospace'}}>

      {/* Top nav — minimal */}
      <nav className="h-11 border-b border-[#111] flex items-center justify-between px-8 flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded-sm flex items-center justify-center">
            <span className="text-black text-[7px] font-bold">FS</span>
          </div>
          <span className="text-xs text-[#666] tracking-widest uppercase">FirstSignal</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="text-[10px] text-[#333] hover:text-[#666] tracking-widest uppercase transition-colors">Dashboard</Link>
          <Link href="/chat" className="text-[10px] text-[#333] hover:text-[#666] tracking-widest uppercase transition-colors">Chat</Link>
          <Link href="/dashboard" className="text-[10px] text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded hover:bg-emerald-500/5 transition-all tracking-widest uppercase">
            Enter →
          </Link>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* Left panel — context */}
        <div className="w-72 border-r border-[#111] flex flex-col flex-shrink-0">

          {/* Main statement */}
          <div className="p-8 border-b border-[#111]">
            <p className="text-[9px] text-[#333] uppercase tracking-widest mb-4">What this is</p>
            <p className="text-lg font-medium leading-snug">
  <span className="text-[#e5e5e5]">An AI that resolves</span>
  <br/>
  <span className="text-[#e5e5e5]">customer issues</span>
  <br/>
  <span className="text-emerald-400">before humans know</span>
  <br/>
  <span className="text-emerald-400">they exist.</span>
</p>
          </div>

          {/* Live metrics */}
          <div className="p-6 border-b border-[#111]">
            <p className="text-[9px] text-[#333] uppercase tracking-widest mb-4">Live system</p>
            <div className="space-y-4">
              {[
                { label: 'Response time', value: '<800ms', color: '#10b981' },
                { label: 'Resolution rate', value: '87%', color: '#10b981' },
                { label: 'Human time saved', value: '94%', color: '#10b981' },
                { label: 'Avg sentiment lift', value: '+34pts', color: '#f59e0b' },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[11px] text-[#444]">{m.label}</span>
                  <span className="text-[11px] font-mono" style={{color: m.color}}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What it does */}
          <div className="p-6 border-b border-[#111]">
            <p className="text-[9px] text-[#333] uppercase tracking-widest mb-4">Capabilities</p>
            <div className="space-y-3">
              {[
                { label: 'Sentiment detection', active: true },
                { label: 'Cross-session memory', active: true },
                { label: 'Autonomous resolution', active: true },
                { label: 'Proactive outreach', active: true },
                { label: 'Voice callbacks', active: true },
                { label: 'Escalation intelligence', active: true },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${c.active ? 'bg-emerald-500' : 'bg-[#333]'}`}></div>
                  <span className="text-[11px] text-[#555]">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stack */}
          <div className="p-6">
            <p className="text-[9px] text-[#333] uppercase tracking-widest mb-4">Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {['Next.js', 'Supabase', 'Groq', 'VAPI', 'Tailwind', 'pgvector'].map((t, i) => (
                <span key={i} className="text-[9px] text-[#444] border border-[#161616] px-2 py-0.5 rounded">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Center — live demo */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{backgroundImage: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)', backgroundSize: '24px 24px'}}>

          {/* Demo header */}
          <div className="px-8 py-4 border-b border-[#111] flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-[9px] text-emerald-500/60 uppercase tracking-widest">Live demonstration</p>
<p className="text-xs text-[#888] mt-0.5">6 specialized agents collaborating in real time</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] text-[#444] uppercase tracking-widest">Running</span>
            </div>
          </div>

          {/* Live conversation */}
          <div className="flex-1 overflow-hidden px-8 py-6">
            <div className="space-y-3 max-w-2xl">
              {DEMO_MESSAGES.map((msg, i) => {
                if (!visibleMessages.includes(i)) return null
                if (msg.role === 'system') return (
                  <div key={`${loopKey}-${i}`} className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-[#111]"></div>
                    <span className="text-[9px] text-[#333] font-mono px-2">{msg.text}</span>
                    <div className="h-px flex-1 bg-[#111]"></div>
                  </div>
                )
                if (msg.role === 'customer') return (
                  <div key={`${loopKey}-${i}`} className="flex justify-end">
                    <div className="max-w-sm">
                      <p className="text-[9px] text-[#333] text-right mb-1">{msg.name}</p>
                      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl rounded-br-sm px-4 py-2.5">
                        <p className="text-xs text-[#999]">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                )
                if (msg.role === 'aria') return (
                  <div key={`${loopKey}-${i}`} className="flex justify-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-emerald-400 text-[8px]">A</span>
                    </div>
                    <div className="max-w-sm">
                      <p className="text-[9px] text-emerald-500/60 mb-1">Aria</p>
                      <div className="bg-[#0a0f0c] border border-emerald-500/10 rounded-2xl rounded-bl-sm px-4 py-2.5">
                        <p className="text-xs text-[#aaa] leading-relaxed">
                          <TypewriterText key={`tw-${loopKey}-${i}`} text={msg.text} />
                        </p>
                      </div>
                    </div>
                  </div>
                )
                return null
              })}
            </div>
          </div>

          {/* Bottom CTA bar */}
          <div className="px-8 py-5 border-t border-[#111] flex items-center justify-between flex-shrink-0">
            <p className="text-[11px] text-[#666]">This conversation is happening live. Every response is real AI.</p>
            <div className="flex items-center gap-3">
              <Link href="/chat"
                className="text-[11px] px-4 py-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 transition-colors font-medium tracking-wide">
                Try it yourself →
              </Link>
              <Link href="/dashboard"
                className="text-[11px] px-4 py-2 border border-[#1a1a1a] text-[#666] rounded-lg hover:border-[#222] transition-colors tracking-wide">
                View dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Right panel — system status */}
        <div className="w-64 border-l border-[#111] flex flex-col flex-shrink-0">

          <div className="p-6 border-b border-[#111]">
            <p className="text-[9px] text-[#333] uppercase tracking-widest mb-4">System status</p>
            <div className="space-y-3">
              {[
                { label: 'AI engine', status: 'operational', color: 'bg-emerald-500' },
                { label: 'Memory store', status: 'operational', color: 'bg-emerald-500' },
                { label: 'Sentiment API', status: 'operational', color: 'bg-emerald-500' },
                { label: 'Voice (VAPI)', status: 'operational', color: 'bg-emerald-500' },
                { label: 'Outreach cron', status: 'operational', color: 'bg-emerald-500' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[10px] text-[#444]">{s.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1 h-1 rounded-full ${s.color}`}></div>
                    <span className="text-[9px] text-[#333]">{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-[#111]">
            <p className="text-[9px] text-[#333] uppercase tracking-widest mb-4">Actions fired today</p>
            <div className="space-y-2.5">
              {[
                { label: 'Refunds', value: '1', color: '#ef4444' },
                { label: 'Discounts', value: '0', color: '#f59e0b' },
                { label: 'Redeliveries', value: '0', color: '#3b82f6' },
                { label: 'Proactive msgs', value: '2', color: '#10b981' },
                { label: 'Escalations', value: '3', color: '#ef4444' },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[10px] text-[#444]">{a.label}</span>
                  <span className="text-[10px] font-mono" style={{color: a.color}}>{a.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
  <p className="text-[9px] text-[#333] uppercase tracking-widest mb-4">Agent architecture</p>
  <div className="space-y-0">
    {[
      { name: 'Sentiment Agent', desc: 'Scores every message 0-100', color: 'text-red-400', border: 'border-red-500/20' },
      { name: 'Memory Agent', desc: 'Retrieves customer history', color: 'text-blue-400', border: 'border-blue-500/20' },
      { name: 'Retention Agent', desc: 'Detects churn risk', color: 'text-amber-400', border: 'border-amber-500/20' },
      { name: 'Resolution Agent', desc: 'Executes actions', color: 'text-emerald-400', border: 'border-emerald-500/20' },
      { name: 'Proactive Agent', desc: 'Initiates outreach', color: 'text-blue-400', border: 'border-blue-500/20' },
      { name: 'Voice Agent', desc: 'Handles escalations', color: 'text-emerald-400', border: 'border-emerald-500/20' },
    ].map((a, i, arr) => (
      <div key={i} className="flex flex-col items-start">
        <div className={`w-full px-2.5 py-2 border ${a.border} rounded bg-[#0a0a0a]`}>
          <p className={`text-[10px] font-medium ${a.color}`}>{a.name}</p>
          <p className="text-[9px] text-[#333] mt-0.5">{a.desc}</p>
        </div>
        {i < arr.length - 1 && (
          <div className="flex items-center gap-1 ml-3 py-0.5">
            <div className="w-px h-3 bg-[#1a1a1a]"></div>
            <span className="text-[8px] text-[#222]">↓</span>
          </div>
        )}
      </div>
    ))}
  </div>
</div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-8 border-t border-[#111] flex items-center justify-between px-8 flex-shrink-0">
        <span className="text-[9px] text-[#222] font-mono">FIRSTSIGNAL · AUTONOMOUS CUSTOMER INTELLIGENCE</span>
        <span className="text-[9px] text-[#222] font-mono">GROQ · SUPABASE · VAPI · NEXT.JS</span>
      </div>

    </div>
  )
}
