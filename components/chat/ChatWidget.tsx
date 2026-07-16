'use client'
import { useState, useRef, useEffect, type ReactNode } from 'react'
import { getBrand, type Brand } from '@/lib/brands'

const DEMO_CUSTOMER_ID = '11111111-1111-1111-1111-111111111111'

interface TraceStep {
  agent: string
  decision: string
  detail?: string
  ms: number
}

interface GuardrailOutcome {
  action: string
  allowed: boolean
  rule: string
  reason: string
}

interface ChatMessage {
  role: string
  content: string
  sentiment?: any
  isEscalated?: boolean
  memoriesUsed?: number
  memoryMode?: string
  action?: any
  guardrails?: GuardrailOutcome[]
  injectionFlagged?: boolean
  trace?: { steps: TraceStep[]; totalMs: number }
}

function traceColor(score: number) {
  return score > 60 ? '#10b981' : score > 40 ? '#f59e0b' : score > 20 ? '#f97316' : '#ef4444'
}

function TraceRow({ label, children }: { label: string, children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-[10px] text-[#444] flex-shrink-0">{label}</span>
      <span className="text-[10px] text-right">{children}</span>
    </div>
  )
}

// Collapsible "AI reasoning" trace shown under an Aria message
function ReasoningTrace({ msg }: { msg: ChatMessage }) {
  const [open, setOpen] = useState(false)
  const s = msg.sentiment
  const hasSentiment = s && typeof s.score === 'number'
  const hasMemory = typeof msg.memoriesUsed === 'number'
  const hasChurn = s && typeof s.churnRisk !== 'undefined'
  const hasAction = msg.action && msg.action.action && msg.action.action !== 'none'
  const hasEscalated = typeof msg.isEscalated !== 'undefined'

  const hasTrace = Boolean(msg.trace?.steps?.length || msg.guardrails?.length)

  if (!(hasSentiment || hasMemory || hasChurn || hasAction || hasEscalated || hasTrace)) return null

  const label = hasSentiment
    ? (s.score > 60 ? 'Positive' : s.score > 40 ? 'Neutral' : s.score > 20 ? 'At risk' : 'Critical')
    : ''

  return (
    <div className="w-full mt-1">
      <button onClick={() => setOpen(o => !o)}
        className="text-[10px] text-[#333] hover:text-[#555] transition-colors" style={{ fontFamily: 'monospace' }}>
        {open ? '▾' : '▸'} AI reasoning
      </button>
      <div className="overflow-hidden transition-all duration-300 ease-out" style={{ maxHeight: open ? 640 : 0 }}>
        <div className="mt-1.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-1.5" style={{ fontFamily: 'monospace' }}>
          {hasSentiment && (
            <TraceRow label="Sentiment">
              <span className="inline-flex items-center gap-1.5 align-middle">
                <span className="inline-block w-12 h-0.5 bg-[#1a1a1a] rounded overflow-hidden align-middle">
                  <span className="block h-full rounded" style={{ width: `${s.score}%`, background: traceColor(s.score) }}></span>
                </span>
                <span style={{ color: traceColor(s.score) }}>{s.score}/100 · {label}</span>
              </span>
            </TraceRow>
          )}
          {hasMemory && (
            <TraceRow label="Memory">
              <span className="text-[#888]">
                {msg.memoriesUsed} memories{msg.memoryMode === 'semantic' ? ' · pgvector similarity' : ''}
              </span>
            </TraceRow>
          )}
          {hasChurn && (
            <TraceRow label="Churn risk"><span style={{ color: s.churnRisk ? '#ef4444' : '#10b981' }}>{s.churnRisk ? 'HIGH' : 'LOW'}</span></TraceRow>
          )}
          {hasAction && (
            <TraceRow label="Action"><span className="text-emerald-400">{msg.action.action} → {msg.action.message}</span></TraceRow>
          )}
          {hasEscalated && (
            <TraceRow label="Escalated"><span style={{ color: msg.isEscalated ? '#ef4444' : '#555' }}>{msg.isEscalated ? 'Yes' : 'No'}</span></TraceRow>
          )}

          {/* Guardrail verdicts — every action the model proposed, allowed or blocked */}
          {(msg.guardrails || []).length > 0 && (
            <div className="mt-1 pt-1 border-t border-[#141414]">
              {msg.guardrails!.map((g, i) => (
                <div key={i} className="py-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] text-[#444]">Guardrail</span>
                    <span className="text-[10px]" style={{ color: g.allowed ? '#10b981' : '#ef4444' }}>
                      {g.action} → {g.allowed ? '✓ allowed' : '✗ blocked'} · {g.rule}
                    </span>
                  </div>
                  {!g.allowed && <p className="text-[9px] text-[#666] text-right mt-0.5">{g.reason}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Full pipeline timeline */}
          {msg.trace && msg.trace.steps.length > 0 && (
            <div className="mt-1 pt-1 border-t border-[#141414]">
              <div className="flex items-center justify-between py-0.5">
                <span className="text-[10px] text-[#444]">Pipeline</span>
                <span className="text-[10px] text-[#555]">{msg.trace.totalMs}ms total</span>
              </div>
              {msg.trace.steps.map((s, i) => (
                <div key={i} className="flex items-baseline justify-between gap-2 py-0.5">
                  <span className="text-[9px] text-emerald-500/60 w-20 flex-shrink-0">{s.agent}</span>
                  <span className="text-[9px] text-[#777] flex-1 text-right leading-relaxed">{s.decision}</span>
                  <span className="text-[9px] text-[#3a3a3a] w-12 text-right flex-shrink-0">{s.ms}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0,1,2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-bounce"
          style={{animationDelay:`${i*150}ms`, animationDuration:'0.8s'}}></div>
      ))}
    </div>
  )
}

function SentimentBar({ score, language }: { score: number, language?: string }) {
  const color = score > 60 ? '#10b981' : score > 40 ? '#f59e0b' : score > 20 ? '#f97316' : '#ef4444'
  const label = score > 60 ? 'Positive' : score > 40 ? 'Neutral' : score > 20 ? 'At risk' : 'Critical'
  const isHindi = language === 'hindi' || language === 'hinglish'
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-b border-[#141414]">
      <span className="text-[9px] text-[#444] uppercase tracking-widest">Sentiment</span>
      <div className="flex-1 h-0.5 bg-[#1a1a1a] rounded overflow-hidden">
        <div className="h-full rounded transition-all duration-700" style={{width:`${score}%`, background: color}}></div>
      </div>
      {language && (
        isHindi ? (
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 tracking-widest">
            HI · हिंदी
          </span>
        ) : (
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#222] text-[#555] tracking-widest">
            EN
          </span>
        )
      )}
      <span className="text-[9px] font-mono transition-colors duration-700" style={{color}}>{score}/100 · {label}</span>
    </div>
  )
}

export default function ChatWidget({ brand }: { brand?: Brand }) {
  const activeBrand = brand ?? getBrand()
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `Hi! I'm ${activeBrand.agentName} from ${activeBrand.name} support. How can I help you today?`, sentiment: null }
  ])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [liveSteps, setLiveSteps] = useState<TraceStep[]>([])
  const [liveReply, setLiveReply] = useState('')
  const [input, setInput] = useState('')
  const [sentiment, setSentiment] = useState(50)
  const [isEscalated, setIsEscalated] = useState(false)
  const [lastAction, setLastAction] = useState<any>(null)
  const [detectedLang, setDetectedLang] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, liveSteps, liveReply])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    setInput('')
    setLoading(true)

    const userMsg = { role: 'user', content: text, sentiment: null }
    setMessages(prev => [...prev, userMsg])

    const applyResult = (data: any) => {
      if (data.conversationId) setConversationId(data.conversationId)
      if (data.sentiment?.score) setSentiment(data.sentiment.score)
      if (data.isEscalated) setIsEscalated(true)
      if (data.action?.action && data.action.action !== 'none') setLastAction(data.action)
      if (data.detectedLanguage) setDetectedLang(data.detectedLanguage)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        sentiment: data.sentiment,
        isEscalated: data.isEscalated,
        memoriesUsed: data.memoriesUsed,
        memoryMode: data.memoryMode,
        action: data.action,
        guardrails: data.guardrails,
        injectionFlagged: data.injectionFlagged,
        trace: data.trace
      }])
    }

    try {
      // Stream the pipeline live: agent steps as they execute, reply tokens as
      // they're generated, then a final `done` event with the full result.
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ message: text, customerId: DEMO_CUSTOMER_ID, conversationId, brandId: activeBrand.id })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      if (!(res.headers.get('content-type') || '').includes('text/event-stream')) {
        applyResult(await res.json())
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finished = false

      while (!finished) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const frames = buffer.split('\n\n')
        buffer = frames.pop() || ''
        for (const frame of frames) {
          const line = frame.trim()
          if (!line.startsWith('data: ')) continue
          const evt = JSON.parse(line.slice(6))
          if (evt.type === 'step') setLiveSteps(prev => [...prev, evt.step])
          else if (evt.type === 'token') setLiveReply(prev => prev + evt.text)
          else if (evt.type === 'reset') setLiveReply('')
          else if (evt.type === 'error') throw new Error(evt.message)
          else if (evt.type === 'done') { applyResult(evt.result); finished = true }
        }
      }
      if (!finished) throw new Error('stream ended early')
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, something went wrong. Please try again.",
        sentiment: null
      }])
    } finally {
      setLoading(false)
      setLiveSteps([])
      setLiveReply('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#080808]">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#141414] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full flex items-center justify-center border"
              style={{ backgroundColor: `${activeBrand.primaryColor}22`, borderColor: `${activeBrand.primaryColor}4d` }}>
              <span className="text-xs font-medium" style={{ color: activeBrand.primaryColor }}>{activeBrand.agentName[0]}</span>
            </div>
            <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-[#080808]"
              style={{ backgroundColor: activeBrand.primaryColor }}></div>
          </div>
          <div>
            <p className="text-xs font-medium text-[#e5e5e5]">{activeBrand.agentName} — {activeBrand.name} Support</p>
            <p className="text-[10px]" style={{ color: activeBrand.primaryColor }}>● Online · Powered by FirstSignal</p>
          </div>
        </div>
        {isEscalated && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded">
            <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[9px] text-red-400 uppercase tracking-widest">Escalated</span>
          </div>
        )}
      </div>

      {/* Sentiment bar */}
      <SentimentBar score={sentiment} language={detectedLang ?? undefined} />

      {/* Action banner */}
      {lastAction && (
        <div className="mx-3 mt-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/15 rounded-lg flex items-center gap-2">
          <span className="text-emerald-500 text-xs">✓</span>
          <span className="text-[11px] text-emerald-400">{lastAction.message}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-emerald-400 text-[9px]">{activeBrand.agentName[0]}</span>
              </div>
            )}
            <div className={`max-w-[78%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1a1a1a] text-[#ccc] rounded-br-sm border border-[#222]'
                  : 'bg-[#111] text-[#ddd] rounded-bl-sm border border-[#1a1a1a]'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'assistant' && <ReasoningTrace msg={msg} />}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-emerald-400 text-[9px]">{activeBrand.agentName[0]}</span>
            </div>
            <div className="max-w-[78%] flex flex-col items-start">
              <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl rounded-bl-sm">
                {liveReply ? (
                  <div className="px-3.5 py-2.5 text-xs leading-relaxed text-[#ddd]">
                    {liveReply}
                    <span className="inline-block w-1.5 h-3 ml-0.5 bg-emerald-400/80 align-middle animate-pulse"></span>
                  </div>
                ) : (
                  <TypingDots />
                )}
              </div>
              {/* Live pipeline — agents reporting in as they run */}
              {liveSteps.length > 0 && (
                <div className="mt-1 px-2 py-1 space-y-0.5" style={{ fontFamily: 'monospace' }}>
                  {liveSteps.slice(-4).map((s, i, arr) => (
                    <p key={`${s.agent}-${i}`} className="text-[9px] leading-tight transition-opacity"
                      style={{ opacity: i === arr.length - 1 ? 1 : 0.45 }}>
                      <span className="text-emerald-500/70">{s.agent}</span>
                      <span className="text-[#555]"> · {s.decision}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {['Where is my order?', 'I want a refund', 'Wrong item delivered', 'Track my order'].map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className="text-[10px] px-2.5 py-1 border border-[#222] text-[#666] rounded-full hover:border-emerald-500/30 hover:text-emerald-500 transition-colors">
              {q}
            </button>
          ))}
          {['मेरा ऑर्डर कहाँ है?', 'मुझे रिफंड चाहिए', 'गलत आइटम मिला'].map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className="text-[10px] px-2.5 py-1 border border-emerald-500/20 text-[#777] rounded-full hover:border-emerald-500/40 hover:text-emerald-500 transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-2.5 focus-within:border-emerald-500/30 transition-colors">
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-xs text-[#ccc] placeholder-[#333] outline-none"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p className="text-[9px] text-[#222] text-center mt-1.5 tracking-widest">SECURED BY FIRSTSIGNAL AI</p>
      </div>
    </div>
  )
}
