'use client'

import { useEffect, useRef, useState } from 'react'

type Step = {
  at: number
  score: number
  risk?: string
  action?: string
  agent?: string
} & (
  | { kind: 'user'; name: string; text: string }
  | { kind: 'aria'; text: string }
  | { kind: 'sys'; text: string; tone: 'alert' | 'warn' | 'ok' }
)

const SCRIPT: Step[] = [
  { at: 400, kind: 'user', name: 'Priya S.', text: 'where is my order its been 6 days', score: 79 },
  { at: 1500, kind: 'sys', agent: 'Sentiment', text: 'FRUSTRATED · 22/100 · confidence 0.94', tone: 'alert', score: 22 },
  { at: 2400, kind: 'sys', agent: 'Memory', text: 'ORD-2847 · 3 prior orders · 2 late · ₹41,200 lifetime', tone: 'warn', score: 22 },
  {
    at: 3300,
    kind: 'aria',
    agent: 'Resolution',
    text: "Priya, your order ORD-2847 is stuck at the Pune hub — that's on us. I've escalated it to priority dispatch and applied a 15% apology credit.",
    score: 22,
  },
  { at: 6400, kind: 'sys', agent: 'Resolution', text: 'apply_discount → SORRY15-XK2PQ · memory written', tone: 'ok', score: 26, action: 'Discount' },
  { at: 7600, kind: 'user', name: 'Priya S.', text: 'I needed this for my wedding next week this is unacceptable', score: 26 },
  { at: 8800, kind: 'sys', agent: 'Retention', text: 'CHURN RISK HIGH · wedding deadline detected · escalating', tone: 'alert', score: 14, risk: 'HIGH' },
  {
    at: 9900,
    kind: 'aria',
    agent: 'Voice',
    text: "A wedding changes this entirely. Express redelivery is confirmed for Thursday, and I'm calling you right now to walk you through it.",
    score: 14,
  },
  { at: 12900, kind: 'sys', agent: 'Voice', text: 'outbound call placed · 00:42 · customer confirmed', tone: 'ok', score: 48, action: 'Voice call' },
  { at: 14000, kind: 'sys', agent: 'Result', text: 'REF-1780042847773 · resolved · human minutes: 0', tone: 'ok', score: 84, action: 'Redelivery', risk: 'RESOLVED' },
]

const LOOP = 17000

const TONE: Record<string, string> = {
  alert: '#ef4444',
  warn: '#f59e0b',
  ok: '#10b981',
}

const AGENTS = ['Sentiment', 'Memory', 'Retention', 'Resolution', 'Proactive', 'Voice']

function scoreColor(s: number) {
  if (s < 30) return '#ef4444'
  if (s < 60) return '#f59e0b'
  return '#10b981'
}

function Typewriter({ text, speed = 16 }: { text: string; speed?: number }) {
  // Each instance is keyed per message, so it always mounts with an empty buffer.
  const [shown, setShown] = useState('')
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return (
    <>
      {shown}
      {shown.length < text.length && (
        <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-px bg-emerald-400 align-middle" />
      )}
    </>
  )
}

export default function LiveReplay() {
  // One clock drives the whole replay. State only commits when the step actually
  // changes, so this doesn't re-render on every frame.
  const [{ visible, cycle }, setPlayhead] = useState({ visible: 0, cycle: 0 })
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const next = {
        cycle: Math.floor(elapsed / LOOP),
        visible: SCRIPT.filter((s) => s.at <= elapsed % LOOP).length,
      }
      setPlayhead((prev) =>
        prev.visible === next.visible && prev.cycle === next.cycle ? prev : next
      )
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [visible])

  const shown = SCRIPT.slice(0, visible)
  const last = shown[shown.length - 1]
  const score = last?.score ?? 79
  const risk = [...shown].reverse().find((s) => s.risk)?.risk ?? 'LOW'
  const actions = shown.filter((s) => s.action).map((s) => s.action as string)
  const activeAgent = last?.agent

  const riskColor = risk === 'HIGH' ? '#ef4444' : risk === 'RESOLVED' ? '#10b981' : '#666'

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {/* Conversation */}
      <div className="flex flex-col rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] lg:col-span-2">
        <div className="flex shrink-0 items-center justify-between border-b border-[#141414] px-5 py-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-500">
            Live demonstration
          </span>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#444]">Running</span>
          </div>
        </div>

        <div
          ref={scroller}
          className="min-h-105 flex-1 space-y-3 overflow-hidden px-5 py-5"
          style={{
            backgroundImage: 'radial-gradient(circle, #141414 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {shown.map((s, i) => {
            if (s.kind === 'sys') {
              return (
                <div key={`${cycle}-${i}`} className="animate-fadein flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-[#1a1a1a]" />
                  <span
                    className="font-mono text-[9px] uppercase tracking-wider"
                    style={{ color: TONE[s.tone] }}
                  >
                    {s.agent}
                  </span>
                  <span className="font-mono text-[9px] text-[#666]">{s.text}</span>
                  <div className="h-px flex-1 bg-[#1a1a1a]" />
                </div>
              )
            }

            if (s.kind === 'user') {
              return (
                <div key={`${cycle}-${i}`} className="animate-fadein flex justify-end">
                  <div className="max-w-sm">
                    <p className="mb-1 text-right font-mono text-[9px] text-[#444]">{s.name}</p>
                    <div className="rounded-2xl rounded-br-sm border border-[#222] bg-[#111] px-4 py-2.5">
                      <p className="text-xs leading-relaxed text-[#999]">{s.text}</p>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={`${cycle}-${i}`} className="animate-fadein flex justify-start gap-2.5">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/20">
                  <span className="text-[8px] text-emerald-400">A</span>
                </div>
                <div className="max-w-md">
                  <p className="mb-1 font-mono text-[9px] text-emerald-500/60">Aria</p>
                  <div className="rounded-2xl rounded-bl-sm border border-emerald-500/10 bg-[#0f1a14] px-4 py-2.5">
                    <p className="text-xs leading-relaxed text-[#ccc]">
                      <Typewriter text={s.text} />
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="shrink-0 border-t border-[#141414] px-5 py-3">
          <p className="text-[11px] text-[#666]">
            Every response, score and action above is produced by the live system.
          </p>
        </div>
      </div>

      {/* Live agent state */}
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#444]">Sentiment</p>
          <div className="mt-3 flex items-end justify-between">
            <p
              className="font-mono text-4xl leading-none tabular-nums transition-colors duration-500"
              style={{ color: scoreColor(score) }}
            >
              {score}
            </p>
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: riskColor }}>
              churn {risk}
            </span>
          </div>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[#1a1a1a]">
            <div
              className="h-1 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${score}%`, background: scoreColor(score) }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#444]">Agents</p>
          <div className="mt-3 space-y-2.5">
            {AGENTS.map((a) => {
              const on = activeAgent === a
              return (
                <div key={a} className="flex items-center justify-between">
                  <span
                    className={`text-[11px] transition-colors duration-300 ${
                      on ? 'text-emerald-400' : 'text-[#555]'
                    }`}
                  >
                    {a}
                  </span>
                  <span
                    className={`h-1 w-1 rounded-full transition-all duration-300 ${
                      on ? 'scale-150 animate-pulse bg-emerald-500' : 'bg-[#222]'
                    }`}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#444]">Actions fired</p>
          <div className="mt-3 space-y-2">
            {actions.length === 0 && (
              <p className="font-mono text-[10px] text-[#333]">awaiting signal…</p>
            )}
            {actions.map((a, i) => (
              <div
                key={`${cycle}-${a}-${i}`}
                className="animate-fadein flex items-center gap-2 rounded border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1.5"
              >
                <span className="text-[10px] text-emerald-500">✓</span>
                <span className="text-[10px] text-[#aaa]">{a}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-[9px] uppercase tracking-widest text-[#333]">
            Human minutes: 0
          </p>
        </div>
      </div>
    </div>
  )
}
