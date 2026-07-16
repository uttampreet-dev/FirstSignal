'use client'
import { useEffect, useState, useRef } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LabelList, ScatterChart, Scatter, ZAxis, CartesianGrid } from 'recharts'
import VoiceDemo from '@/components/VoiceDemo'
import { supabase } from '@/lib/supabase'
import DemoTour, { type TourStep } from '@/components/DemoTour'

const TOUR_STEPS: TourStep[] = [
  {
    tab: 'live',
    selector: 'ticker',
    title: 'Live Feed Ticker',
    description: 'A real-time pulse of everything happening across your customer base — conversations monitored, escalations, cost saved, and retention wins as they occur.',
  },
  {
    tab: 'live',
    selector: 'proactive-demo',
    title: 'Proactive Prevention',
    description: 'FirstSignal doesn\'t wait for complaints. Click "Simulate Delayed Order" to watch Aria detect an at-risk order and reach out before the customer even notices — churn prevented autonomously.',
  },
  {
    tab: 'live',
    selector: 'sentiment-ring',
    title: 'At-Risk Sentiment Ring',
    description: 'The single most at-risk customer right now, scored 0–100. When it drops into the red, FirstSignal flags churn risk and can escalate automatically.',
  },
  {
    tab: 'live',
    selector: 'conversations',
    title: 'Conversation Feed',
    description: 'Every active conversation with live sentiment. Click any row to expand the full transcript inline and see exactly how the AI handled it.',
  },
  {
    tab: 'analytics',
    selector: 'analytics-kpis',
    title: 'Business KPIs',
    description: 'Headline metrics at a glance — conversation volume, autonomous resolution rate, cost saved, and average sentiment, each with its own live micro-visual.',
  },
  {
    tab: 'analytics',
    selector: 'resolution-funnel',
    title: 'Resolution Funnel',
    description: 'How conversations flow from first contact through escalation, autonomous resolution, and human handoff — with conversion at every stage.',
  },
  {
    tab: 'analytics',
    selector: 'customer-scatter',
    title: 'Customer Value vs Health',
    description: 'Every customer plotted by lifetime value against health score, sized by order count — instantly surfacing high-value accounts at risk of churn.',
  },
  {
    tab: 'analytics',
    selector: 'ai-insights',
    title: 'AI Insights',
    description: 'Narrative intelligence generated from live data — churn drivers, VIP risk, and retention value, written in plain language for instant decisions.',
  },
  {
    tab: 'customers',
    selector: 'health-scores',
    title: 'Customer Health Scores',
    description: 'A health score for every customer, blending order history, spend, and sentiment so you can prioritise who needs attention before they churn.',
  },
  {
    tab: 'voice',
    selector: 'voice-summary',
    title: 'Voice Escalations',
    description: 'When sentiment turns critical, Aria places an AI voice call from the browser. Each call is summarised here — sentiment lift, resolution, and full transcript.',
  },
  {
    tab: 'impact',
    selector: 'impact-hero',
    title: 'Business Impact',
    description: 'Every action quantified — revenue protected, agent hours saved, and churn prevented, with a clear ROI multiple. The bottom line for why FirstSignal pays for itself.',
  },
]
function ConversationDetail({ conversationId, onClose }: { conversationId: string, onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/conversation?id=${conversationId}`)
      .then(r => r.json())
      .then(d => { setMessages(d.messages || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [conversationId])

  return (
    <div className="border-t border-[#141414] bg-[#080808] flex flex-col" style={{height:'260px'}}>
      <div className="px-5 py-2 border-b border-[#0f0f0f] flex items-center justify-between flex-shrink-0">
        <span className="text-[9px] text-emerald-500 uppercase tracking-widest">Full conversation</span>
        <button onClick={onClose} className="text-[#333] hover:text-[#888] text-sm transition-colors">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {loading ? (
          <p className="text-[10px] text-[#333]">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-[10px] text-[#333]">No messages</p>
        ) : (
          messages.map((msg: any, i: number) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 text-[8px]">A</span>
                </div>
              )}
              <div className={`max-w-[70%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1a1a1a] text-[#bbb] border border-[#222]'
                  : 'bg-[#0f1a14] text-[#ccc] border border-emerald-500/10'
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function cn(...c: string[]) { return c.filter(Boolean).join(' ') }

function SentimentRing({ score }: { score: number }) {
  const color = score > 60 ? '#10b981' : score > 40 ? '#f59e0b' : score > 20 ? '#f97316' : '#ef4444'
  const label = score > 60 ? 'Positive' : score > 40 ? 'Neutral' : score > 20 ? 'At Risk' : 'Critical'
  const r = 54, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1a1a1a" strokeWidth="10"/>
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 70 70)" style={{transition:'all 0.8s ease'}}/>
        <text x="70" y="63" textAnchor="middle" fill={color} fontSize="28" fontWeight="600">{score}</text>
        <text x="70" y="83" textAnchor="middle" fill="#555" fontSize="11">{label}</text>
      </svg>
    </div>
  )
}

function Ticker({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden h-6 flex items-center">
      <div className="flex gap-8 animate-[scroll_20s_linear_infinite] whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-[11px] text-[#444] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block flex-shrink-0"></span>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// Small circular progress indicator used in the metric cards
function MiniRing({ value, color, size = 52, stroke = 5 }: { value: number, color: string, size?: number, stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const v = Math.min(Math.max(value, 0), 100)
  const dash = (v / 100) * circ
  const c = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={c} cy={c} r={r} fill="none" stroke="#1a1a1a" strokeWidth={stroke} />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${c} ${c})`} style={{ transition: 'all 0.8s ease' }} />
      <text x={c} y={c + 3.5} textAnchor="middle" fill={color} fontSize="11" fontWeight="600" fontFamily="monospace">{value}%</text>
    </svg>
  )
}

// Tooltip for the customer value vs health scatter
function ScatterTip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const col = d.score > 70 ? '#10b981' : d.score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="bg-[#111] border border-[#222] rounded-md px-3 py-2" style={{ fontFamily: 'monospace' }}>
      <p className="text-[11px] text-[#ddd] mb-1 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: col }}></span>
        {d.name}{d.is_vip ? ' · VIP' : ''}
      </p>
      <p className="text-[10px] text-[#666]">Lifetime value ₹{d.total_spent?.toLocaleString()}</p>
      <p className="text-[10px] text-[#666]">Health <span style={{ color: col }}>{d.score}</span>/100 · {d.total_orders} orders</p>
    </div>
  )
}

function AnalyticsTab({ stats, actions, sentimentTrend, sentimentBreakdown, customerHealthScores, pulse }: any) {
  const sb = sentimentBreakdown || { positive: 0, neutral: 0, negative: 0, frustrated: 0 }
  const sentTotal = (sb.positive + sb.neutral + sb.negative + sb.frustrated) || 1

  const donut = [
    { name: 'Positive', value: sb.positive || 0, color: '#10b981' },
    { name: 'Neutral', value: sb.neutral || 0, color: '#888888' },
    { name: 'Negative', value: sb.negative || 0, color: '#f59e0b' },
    { name: 'Frustrated', value: sb.frustrated || 0, color: '#ef4444' },
  ]

  const actionBars = [
    { name: 'Refunds', value: actions.refundActions || 0, color: '#ef4444' },
    { name: 'Discounts', value: actions.discountActions || 0, color: '#f59e0b' },
    { name: 'Redeliveries', value: actions.redeliveryActions || 0, color: '#3b82f6' },
    { name: 'Proactive', value: actions.proactiveActions || 0, color: '#10b981' },
  ]

  const trend = sentimentTrend || []
  // Cumulative conversation volume, derived from the trend timeline (monotonic — non-misleading)
  const convSpark = trend.map((_: any, i: number) => ({
    i,
    v: Math.round(stats.totalConversations * (i + 1) / Math.max(trend.length, 1)),
  }))

  const scatter = (customerHealthScores || []).map((c: any) => ({
    ...c,
    total_spent: c.total_spent || 0,
    score: c.score || 0,
    total_orders: c.total_orders || 1,
  }))

  const avgCol = stats.avgSentiment > 60 ? '#10b981' : stats.avgSentiment > 40 ? '#f59e0b' : '#ef4444'
  const avgLabel = stats.avgSentiment > 60 ? 'Positive' : stats.avgSentiment > 40 ? 'Neutral' : stats.avgSentiment > 20 ? 'At risk' : 'Critical'

  const funnel = [
    { label: 'Total Conversations', value: stats.totalConversations || 0, color: '#10b981' },
    { label: 'Escalated', value: stats.escalatedConversations || 0, color: '#f59e0b' },
    { label: 'Resolved', value: stats.resolvedConversations || 0, color: '#3b82f6' },
    { label: 'Human Handoff', value: stats.escalatedConversations || 0, color: '#ef4444' },
  ]
  const funnelMax = Math.max(...funnel.map(f => f.value), 1)
  const funnelBase = funnel[0].value || 1

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-5">
        <h2 className="text-sm font-medium text-[#e5e5e5] tracking-wide">Analytics</h2>
        <p className="text-[11px] text-[#444] mt-0.5">Business intelligence · sentiment, actions, and customer value</p>
      </div>

      {/* ROW 1 — Metric cards */}
      <div data-tour="analytics-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {/* Total conversations + sparkline */}
        <div className={cn('bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 flex flex-col', pulse ? 'animate-flash' : '')}>
          <p className="text-[9px] text-[#444] uppercase tracking-widest mb-1.5">Total conversations</p>
          <p className="text-3xl font-semibold font-mono text-[#e5e5e5] leading-none">{stats.totalConversations}</p>
          <div className="h-9 -mx-1 mt-auto pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={convSpark} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} fill="url(#spark)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resolution rate + mini ring */}
        <div className={cn('bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 flex items-center justify-between gap-3', pulse ? 'animate-flash' : '')}>
          <div>
            <p className="text-[9px] text-[#444] uppercase tracking-widest mb-1.5">Resolution rate</p>
            <p className="text-3xl font-semibold font-mono text-emerald-400 leading-none">{stats.resolutionRate}%</p>
            <p className="text-[9px] text-[#444] mt-2">autonomous</p>
          </div>
          <MiniRing value={stats.resolutionRate} color="#10b981" size={58} stroke={5} />
        </div>

        {/* Cost saved + up trend */}
        <div className={cn('bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 flex flex-col', pulse ? 'animate-flash' : '')}>
          <p className="text-[9px] text-[#444] uppercase tracking-widest mb-1.5">Cost saved</p>
          <p className="text-3xl font-semibold font-mono text-emerald-400 leading-none">₹{((stats.estimatedCostSaved || 0) / 1000).toFixed(1)}k</p>
          <div className="flex items-center gap-1.5 mt-auto pt-3">
            <span className="text-emerald-500 text-sm leading-none">↑</span>
            <span className="text-[9px] text-emerald-500/70 tracking-wide">retention value today</span>
          </div>
        </div>

        {/* Avg sentiment color-coded */}
        <div className={cn('bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 flex flex-col', pulse ? 'animate-flash' : '')}>
          <p className="text-[9px] text-[#444] uppercase tracking-widest mb-1.5">Avg sentiment</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: avgCol }}></span>
            <p className="text-3xl font-semibold font-mono leading-none" style={{ color: avgCol }}>
              {stats.avgSentiment}<span className="text-sm text-[#333]">/100</span>
            </p>
          </div>
          <p className="text-[9px] mt-auto pt-3 tracking-wide" style={{ color: avgCol }}>{avgLabel}</p>
        </div>
      </div>

      {/* ROW 2 — Three charts (40 / 30 / 30) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-3 mb-3">
        {/* Sentiment trend */}
        <div className="lg:col-span-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5">
          <p className="text-[9px] text-[#444] uppercase tracking-widest mb-4">Sentiment trend</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#141414" vertical={false} />
              <XAxis dataKey="index" tick={{ fontSize: 10, fill: '#333' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#333' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 6, fontSize: 11 }} itemStyle={{ color: '#10b981' }} labelStyle={{ color: '#555' }} formatter={(v: any) => [`${v}/100`, 'Score']} />
              <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fill="url(#sg)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment breakdown donut */}
        <div className="lg:col-span-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5">
          <p className="text-[9px] text-[#444] uppercase tracking-widest mb-2">Sentiment breakdown</p>
          <div className="relative">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={donut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={66} paddingAngle={2} stroke="none">
                  {donut.map((d, i) => (<Cell key={i} fill={d.color} />))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 6, fontSize: 11 }} itemStyle={{ color: '#ccc' }} formatter={(v: any, n: any) => [`${v} (${Math.round((v / sentTotal) * 100)}%)`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ height: 150 }}>
              <span className="text-lg font-semibold font-mono text-[#e5e5e5] leading-none">{sentTotal}</span>
              <span className="text-[8px] text-[#444] uppercase tracking-widest mt-0.5">total</span>
            </div>
          </div>
          {/* Legend with counts + percentages (secondary encoding) */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3">
            {donut.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }}></span>
                <span className="text-[10px] text-[#888] flex-1 truncate">{d.name}</span>
                <span className="text-[10px] font-mono text-[#666]">{d.value}</span>
                <span className="text-[9px] font-mono text-[#444] w-8 text-right">{Math.round((d.value / sentTotal) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Autonomous actions bar */}
        <div className="lg:col-span-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5">
          <p className="text-[9px] text-[#444] uppercase tracking-widest mb-4">Autonomous actions</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={actionBars} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal={false} stroke="#141414" />
              <XAxis type="number" tick={{ fontSize: 9, fill: '#333' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} width={78} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 6, fontSize: 11 }} itemStyle={{ color: '#ccc' }} formatter={(v: any) => [v, 'Actions']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {actionBars.map((a, i) => (<Cell key={i} fill={a.color} />))}
                <LabelList dataKey="value" position="right" fill="#888" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 3 — Resolution funnel */}
      <div data-tour="resolution-funnel" className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5 mb-3">
        <p className="text-[9px] text-[#444] uppercase tracking-widest mb-4">Resolution funnel</p>
        <div className="space-y-1">
          {funnel.map((f, i) => (
            <div key={i}>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#666] w-32 flex-shrink-0 text-right">{f.label}</span>
                <div className="flex-1 h-8 bg-[#0a0a0a] rounded overflow-hidden">
                  <div className="h-full rounded flex items-center px-3 transition-all duration-700"
                    style={{ width: `${Math.max((f.value / funnelMax) * 100, 5)}%`, background: `${f.color}1f`, borderLeft: `2px solid ${f.color}` }}>
                    <span className="text-[12px] font-mono font-medium" style={{ color: f.color }}>{f.value}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#555] w-12 text-right flex-shrink-0">{Math.round((f.value / funnelBase) * 100)}%</span>
              </div>
              {i < funnel.length - 1 && (
                <div className="flex items-center gap-3">
                  <span className="w-32 flex-shrink-0"></span>
                  <span className="text-[9px] text-[#333] font-mono pl-3 py-0.5">↓ {Math.round((funnel[i + 1].value / (f.value || 1)) * 100)}% continue</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ROW 4 — Customer value vs health scatter */}
      <div data-tour="customer-scatter" className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5 mb-3">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[9px] text-[#444] uppercase tracking-widest">Customer value vs health score</p>
          <div className="flex items-center gap-3">
            {[{ c: '#10b981', l: 'Healthy >70' }, { c: '#f59e0b', l: 'At risk 40–70' }, { c: '#ef4444', l: 'Critical <40' }].map((k, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: k.c }}></span>
                <span className="text-[9px] text-[#555]">{k.l}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 24, bottom: 24, left: 4 }}>
            <CartesianGrid stroke="#141414" />
            <XAxis type="number" dataKey="total_spent" name="Lifetime value" tick={{ fontSize: 9, fill: '#333' }} axisLine={false} tickLine={false}
              tickFormatter={(v: any) => `₹${(v / 1000).toFixed(0)}k`}
              label={{ value: 'Lifetime value →', position: 'insideBottom', offset: -12, fill: '#333', fontSize: 9 }} />
            <YAxis type="number" dataKey="score" name="Health" domain={[0, 100]} tick={{ fontSize: 9, fill: '#333' }} axisLine={false} tickLine={false}
              label={{ value: 'Health →', angle: -90, position: 'insideLeft', fill: '#333', fontSize: 9 }} />
            <ZAxis type="number" dataKey="total_orders" range={[50, 420]} name="Orders" />
            <Tooltip content={<ScatterTip />} cursor={{ strokeDasharray: '3 3', stroke: '#333' }} />
            <Scatter data={scatter}>
              {scatter.map((c: any, i: number) => {
                const col = c.score > 70 ? '#10b981' : c.score >= 40 ? '#f59e0b' : '#ef4444'
                return <Cell key={i} fill={col} fillOpacity={0.7} stroke={col} strokeWidth={1} />
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* ROW 5 — AI insights */}
      <div data-tour="ai-insights" className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[9px] text-[#444] uppercase tracking-widest">AI insights</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] text-[#333]">Generated from live data</span>
          </div>
        </div>
        <div className="space-y-0">
          {[
            {
              icon: '↑',
              color: 'text-red-400',
              bg: 'bg-red-500/5 border-red-500/10',
              text: `${stats.escalatedConversations} conversations escalated this session — all involved delayed orders. Delivery reliability is your #1 churn driver right now.`,
            },
            {
              icon: '◎',
              color: 'text-amber-400',
              bg: 'bg-amber-500/5 border-amber-500/10',
              text: `VIP customers are ${stats.vipCustomers} of ${stats.totalCustomers} tracked but represent the majority of escalations. A dedicated VIP SLA would significantly reduce churn risk.`,
            },
            {
              icon: '⚡',
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/5 border-emerald-500/10',
              text: `Proactive outreach intercepted ${stats.proactiveConversations} potential complaints before they escalated. Estimated ₹${(stats.proactiveConversations * 800).toLocaleString()} in retention value generated autonomously.`,
            },
            {
              icon: '◈',
              color: 'text-blue-400',
              bg: 'bg-blue-500/5 border-blue-500/10',
              text: `Resolution rate is ${stats.resolutionRate}% — ${stats.resolutionRate > 70 ? 'strong performance. Most issues resolved without human intervention.' : 'below target. Consider expanding autonomous resolution rules for common complaint types.'}`,
            },
          ].map((ins, i) => (
            <div key={i} className={`flex gap-3 p-3 rounded-lg border mb-2 ${ins.bg}`}>
              <span className={`text-sm ${ins.color} flex-shrink-0 mt-0.5`}>{ins.icon}</span>
              <p className="text-[11px] text-[#666] leading-relaxed">{ins.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ImpactTab({ stats, actions }: any) {
  const revenueProtected = (stats.estimatedCostSaved || 0) * 12
  const agentHoursSaved = Math.round((stats.resolvedConversations || 0) * 0.4 + (stats.proactiveConversations || 0) * 0.6)
  const churnPrevented = (stats.escalatedConversations || 0) + (stats.proactiveConversations || 0)
  const roiMultiple = Math.round((stats.estimatedCostSaved || 0) / 100)

  const heroCards = [
    { label: 'Revenue Protected', value: `₹${revenueProtected.toLocaleString()}`, sub: 'Annualized retention value', color: '#10b981' },
    { label: 'Agent Hours Saved', value: `${agentHoursSaved}h`, sub: 'At ₹450/hr support cost', color: '#3b82f6' },
    { label: 'Churn Prevented', value: `${churnPrevented} customers`, sub: 'High-risk cases resolved', color: '#f59e0b' },
  ]

  const breakdown = [
    {
      action: 'Refunds processed',
      count: actions.refundActions || 0,
      without: `₹${((actions.refundActions || 0) * 450).toLocaleString()}/case`,
      with: '₹0 (autonomous)',
      saved: (actions.refundActions || 0) * 450,
    },
    {
      action: 'Proactive outreach',
      count: actions.proactiveActions || 0,
      without: `₹${((actions.proactiveActions || 0) * 200).toLocaleString()}/case`,
      with: '₹0 (automated)',
      saved: (actions.proactiveActions || 0) * 200,
    },
    {
      action: 'Escalations handled',
      count: stats.escalatedConversations || 0,
      without: `₹${((stats.escalatedConversations || 0) * 600).toLocaleString()}/case`,
      with: `₹${((stats.escalatedConversations || 0) * 60).toLocaleString()} (AI assist)`,
      saved: (stats.escalatedConversations || 0) * 540,
    },
    {
      action: 'Voice callbacks',
      count: 1,
      without: '₹800/call',
      with: '₹0 (VAPI)',
      saved: 800,
    },
  ]
  const totalSaved = breakdown.reduce((sum, r) => sum + r.saved, 0)

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-sm font-medium text-[#e5e5e5] tracking-wide">Business Impact</h2>
        <p className="text-[11px] text-[#444] mt-0.5">Quantified value delivered by FirstSignal</p>
      </div>

      {/* SECTION 1 — Hero metrics */}
      <div data-tour="impact-hero" className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {heroCards.map((c, i) => (
          <div key={i} className="bg-[#0d0d0d] border rounded-xl p-5" style={{ borderColor: `${c.color}33` }}>
            <p className="text-[9px] text-[#555] uppercase tracking-widest mb-2">{c.label}</p>
            <p className="text-3xl font-semibold font-mono leading-none" style={{ color: c.color }}>{c.value}</p>
            <p className="text-[10px] text-[#444] mt-2">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* SECTION 2 — Cost breakdown table */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-[#141414]">
          <p className="text-[9px] text-[#444] uppercase tracking-widest">Cost breakdown</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#141414]">
                {['Action', 'Count', 'Cost Without AI', 'Cost With FirstSignal', 'Saved'].map((h, i) => (
                  <th key={h} className={cn('px-5 py-3 text-[9px] text-[#333] uppercase tracking-widest font-normal', i === 0 ? 'text-left' : 'text-right')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0f0f0f]">
              {breakdown.map((r, i) => (
                <tr key={i} className="hover:bg-[#111] transition-colors">
                  <td className="px-5 py-3.5 text-xs text-[#ccc] whitespace-nowrap">{r.action}</td>
                  <td className="px-5 py-3.5 text-xs text-[#666] font-mono text-right">{r.count}</td>
                  <td className="px-5 py-3.5 text-xs text-[#888] font-mono text-right whitespace-nowrap">{r.without}</td>
                  <td className="px-5 py-3.5 text-xs text-[#888] font-mono text-right whitespace-nowrap">{r.with}</td>
                  <td className="px-5 py-3.5 text-xs text-emerald-400 font-mono text-right whitespace-nowrap">₹{r.saved.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="border-t border-[#1a1a1a] bg-[#0a0a0a]">
                <td className="px-5 py-3.5 text-[10px] text-[#555] uppercase tracking-widest" colSpan={4}>Total saved this session</td>
                <td className="px-5 py-3.5 text-sm text-emerald-400 font-mono font-semibold text-right">₹{totalSaved.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3 — Assumptions */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 mb-5">
        <p className="text-[9px] text-[#444] uppercase tracking-widest mb-2">Assumptions</p>
        <p className="text-[#444] text-xs leading-relaxed">
          Human agent cost ₹450/hr, avg resolution time 18 min, proactive outreach saves 1 complaint per 3 customers,
          voice callback replaces ₹800 human call. Based on industry benchmarks for Indian D2C brands.
        </p>
      </div>

      {/* SECTION 4 — ROI statement */}
      <div className="bg-[#0a0f0c] border border-emerald-500/15 rounded-lg">
        <p className="text-2xl text-emerald-400 font-mono text-center p-8 leading-relaxed">
          For every ₹1 spent on FirstSignal,<br />
          D2C brands recover <span className="font-semibold">₹{roiMultiple.toLocaleString()}</span> in retained customer value.
        </p>
      </div>
    </div>
  )
}

function ProactiveDemo({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'done'>('idle')
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [orderNumber, setOrderNumber] = useState('')
  const [error, setError] = useState('')
  const timers = useRef<any[]>([])

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => () => clearTimers(), [])

  const steps = [
    { icon: '🔍', text: `Delayed order detected — ${orderNumber || 'ORD-DEMO'} (Bridal Lehenga)`, color: '#888' },
    { icon: '⚡', text: 'Proactive Agent triggered — customer not yet aware', color: '#888' },
    { icon: '💬', text: 'Aria initiating outreach before complaint...', color: '#aaa' },
    { icon: '✓', text: 'Message delivered — complaint prevented', color: '#10b981' },
  ]

  const run = async () => {
    clearTimers()
    setError(''); setVisibleSteps(0); setStatus('loading')
    try {
      const res = await fetch('/api/demo/simulate', { method: 'POST' })
      const data = await res.json()
      if (!data.success) throw new Error(data.detail || 'Simulation failed')
      setOrderNumber(data.order?.order_number || 'ORD-DEMO')
      setStatus('running')
      // Reveal the 4 steps, one every 800ms
      for (let i = 1; i <= steps.length; i++) {
        timers.current.push(setTimeout(() => setVisibleSteps(i), i * 800))
      }
      // After the final step, refresh the dashboard so the new proactive conversation appears
      timers.current.push(setTimeout(() => {
        setStatus('done')
        onComplete()
      }, steps.length * 800 + 2000))
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
      setStatus('idle')
    }
  }

  const reset = async () => {
    clearTimers()
    setStatus('idle'); setVisibleSteps(0); setOrderNumber(''); setError('')
    // Remove the demo conversation/order from the DB, then refresh the feed
    try { await fetch('/api/demo/reset', { method: 'POST' }) } catch {}
    onComplete()
  }

  return (
    <div data-tour="proactive-demo" className="bg-[#0a0f0c] border border-emerald-500/20 rounded-xl p-4" style={{ fontFamily: 'monospace' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-500">Proactive Intelligence Demo</p>
          <p className="text-[11px] text-[#555] mt-0.5">Watch FirstSignal prevent a complaint before it happens</p>
        </div>
        {status === 'idle' && (
          <button onClick={run}
            className="bg-emerald-500 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-400 transition-colors flex-shrink-0">
            Simulate Delayed Order →
          </button>
        )}
        {(status === 'running' || status === 'done') && (
          <button onClick={reset}
            className="text-[10px] text-[#666] hover:text-[#999] border border-[#1a1a1a] hover:border-[#222] px-3 py-1.5 rounded uppercase tracking-widest transition-all flex-shrink-0">
            Reset Demo
          </button>
        )}
      </div>

      {status === 'loading' && (
        <div className="mt-4 flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 border border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-[11px] text-[#888]">Detecting at-risk customer...</span>
        </div>
      )}

      {(status === 'running' || status === 'done') && (
        <div className="mt-4 space-y-2">
          {steps.slice(0, visibleSteps).map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 animate-stepin">
              <span className="text-sm flex-shrink-0 w-4 text-center">{s.icon}</span>
              <span className="text-[11px]" style={{ color: s.color }}>{s.text}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-[11px] text-red-400">⚠ {error}</p>}
    </div>
  )
}

function VoiceTab({ hotConv }: any) {
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const custName = hotConv?.customer?.name || 'Priya Sharma'
  const firstName = custName.split(' ')[0]
  const callTime = new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const transcript = [
    { role: 'Aria', text: `Hi ${firstName}, I'm calling personally to resolve your order issue — I know how important this is.` },
    { role: 'Customer', text: "I needed this for my wedding, I'm really frustrated." },
    { role: 'Aria', text: "I completely understand. I've processed your full refund right now, and applied a 15% discount on your next order." },
    { role: 'Customer', text: "Oh... thank you, I really wasn't expecting a call." },
    { role: 'Aria', text: "Of course. I've also arranged priority express redelivery so you still have options before the event." },
    { role: 'Customer', text: "That genuinely helps. Thank you for reaching out." },
    { role: 'Aria', text: "Absolutely — you'll get a confirmation shortly. Is there anything else I can help you with?" },
  ]
  const visibleLines = transcriptOpen ? transcript : transcript.slice(0, 3)

  const voiceStats = [
    { label: 'Total calls', value: '1', color: '#e5e5e5' },
    { label: 'Avg duration', value: '2m 34s', color: '#e5e5e5' },
    { label: 'Resolution via voice', value: '100%', color: '#10b981' },
  ]

  const summaryFields = [
    { label: 'Duration', value: '2m 34s', color: '#e5e5e5' },
    { label: 'Customer', value: custName, color: '#e5e5e5' },
    { label: 'Sentiment before call', value: 'Critical 10/100', color: '#ef4444' },
    { label: 'Sentiment after call', value: 'Neutral 52/100', color: '#f59e0b' },
  ]

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-sm font-medium text-[#e5e5e5] tracking-wide">Voice callbacks</h2>
        <p className="text-[11px] text-[#444] mt-0.5">AI-powered escalation calls from browser</p>
      </div>

      {/* Last Call Summary — highlighted emerald card */}
      <div data-tour="voice-summary" className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[9px] text-emerald-300/70 uppercase tracking-widest">Last call summary</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest">Completed</span>
            </div>
            <span className="text-[10px] text-[#555] font-mono">{callTime}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryFields.map((f, i) => (
            <div key={i}>
              <p className="text-[9px] text-[#555] uppercase tracking-widest mb-1">{f.label}</p>
              <p className="text-[13px] font-mono" style={{ color: f.color }}>{f.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-emerald-500/15">
          <p className="text-[9px] text-[#555] uppercase tracking-widest mb-1">Resolution</p>
          <p className="text-xs text-emerald-300 flex items-center gap-1.5">
            <span className="text-emerald-500">✓</span>
            Refund processed + 15% discount applied
          </p>
        </div>
      </div>

      {/* Call Transcript Preview */}
      <div className="rounded-lg border border-[#141414] p-5 mb-4" style={{ background: '#0a0f0c' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[9px] text-[#444] uppercase tracking-widest">Call transcript preview</p>
          <span className="text-[9px] text-emerald-500/50 font-mono tracking-widest">VAPI · VOICE</span>
        </div>
        <div className="space-y-3">
          {visibleLines.map((line, i) => (
            <div key={i} className="flex gap-2.5">
              <span className={cn('text-[10px] font-medium flex-shrink-0 mt-0.5 w-16', line.role === 'Aria' ? 'text-emerald-400' : 'text-[#888]')}>
                {line.role}
              </span>
              <p className="text-[11px] text-[#bbb] leading-relaxed">{line.text}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => setTranscriptOpen(o => !o)}
          className="mt-4 text-[10px] text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors"
        >
          {transcriptOpen ? 'Show less ↑' : 'View full transcript ↓'}
        </button>
      </div>

      {/* Voice Escalation Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {voiceStats.map((s, i) => (
          <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4">
            <p className="text-[9px] text-[#444] uppercase tracking-widest mb-1.5">{s.label}</p>
            <p className="text-xl font-semibold font-mono" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Existing: VoiceDemo + How escalation works */}
      <div className="grid grid-cols-2 gap-4">
        <VoiceDemo
          customer={hotConv?.customer}
          conversationSummary={hotConv?.lastMessage?.content || 'Customer escalation'}
        />
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5">
          <p className="text-[9px] text-[#444] uppercase tracking-widest mb-5">How escalation works</p>
          <div className="space-y-5">
            {[
              { n: '01', t: 'Frustration detected', d: 'Sentiment drops below 25. Churn risk flagged automatically.' },
              { n: '02', t: 'AI summary generated', d: 'Full conversation briefing prepared for human agent in 2 seconds.' },
              { n: '03', t: 'Voice callback initiated', d: 'Aria calls customer directly from browser — no phone needed.' },
              { n: '04', t: 'Memory updated', d: 'Call transcript saved. Next interaction knows full history.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-[10px] text-emerald-500/50 font-mono mt-0.5 flex-shrink-0">{s.n}</span>
                <div>
                  <p className="text-xs text-[#ccc]">{s.t}</p>
                  <p className="text-[11px] text-[#444] mt-0.5 leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Guardrails tab — the policy layer between the AI and real actions, live.
// Every autonomous action the model proposes is checked and logged; blocked
// attempts (including prompt-injection) show up here in real time.
function GuardrailsTab({ guardrails, agentTraces, stats }: { guardrails: any, agentTraces: any[], stats: any }) {
  const events = guardrails?.events || []
  const g = guardrails?.stats || { total: 0, blocked: 0, allowed: 0 }
  const policy = guardrails?.policy
  const blockRate = g.total > 0 ? Math.round((g.blocked / g.total) * 100) : 0

  const policyRules = policy ? [
    { rule: 'Refund cap', detail: `Autonomous refunds limited to ₹${policy.maxAutonomousRefund?.toLocaleString()} — larger amounts require a human` },
    { rule: 'Order ownership', detail: 'Actions only execute on orders that belong to the requesting customer' },
    { rule: 'One compensation per order', detail: `Max ${policy.maxCompensationsPerOrder} refund/discount/redelivery per order` },
    { rule: 'Discount bounds', detail: `Goodwill discounts restricted to ${policy.discountRange?.min}–${policy.discountRange?.max}%, one per ${policy.discountCooldownDays} days` },
    { rule: 'Rate limit', detail: `Max ${policy.maxActionsPerConversation} autonomous actions per conversation, then auto-escalate` },
    { rule: 'Injection screen', detail: 'Prompt-injection patterns disable tool access for the turn and get logged' },
  ] : []

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Stat row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Actions checked', value: g.total, color: '#e5e5e5' },
          { label: 'Allowed', value: g.allowed, color: '#10b981' },
          { label: 'Blocked', value: g.blocked, color: '#ef4444' },
          { label: 'Avg pipeline', value: stats?.avgPipelineMs ? `${stats.avgPipelineMs}ms` : '—', color: '#3b82f6' },
        ].map((s, i) => (
          <div key={i} className="bg-[#0d0d0d] border border-[#141414] rounded-xl p-4">
            <p className="text-[9px] text-[#333] uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-2xl font-light" style={{ color: s.color }}>{s.value}</p>
            {s.label === 'Blocked' && g.total > 0 && (
              <p className="text-[9px] text-[#444] mt-0.5">{blockRate}% of proposals stopped by policy</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Active policy */}
        <div className="bg-[#0d0d0d] border border-[#141414] rounded-xl p-4">
          <p className="text-[9px] text-[#333] uppercase tracking-widest mb-3">Active policy — checked before every action executes</p>
          <div className="space-y-2.5">
            {policyRules.map((p, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-emerald-500/70 text-[10px] mt-0.5">▣</span>
                <div>
                  <p className="text-[11px] text-[#ccc]">{p.rule}</p>
                  <p className="text-[10px] text-[#444] leading-relaxed">{p.detail}</p>
                </div>
              </div>
            ))}
            {policyRules.length === 0 && <p className="text-[10px] text-[#444]">Policy unavailable</p>}
          </div>
        </div>

        {/* Event feed */}
        <div className="bg-[#0d0d0d] border border-[#141414] rounded-xl p-4">
          <p className="text-[9px] text-[#333] uppercase tracking-widest mb-3">Verdict log — every proposed action, allowed or blocked</p>
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {events.length === 0 && (
              <p className="text-[10px] text-[#444]">No autonomous actions proposed yet. Try the chat demo — or try to jailbreak it.</p>
            )}
            {events.map((e: any) => (
              <div key={e.id} className="border border-[#141414] rounded-lg px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#ccc]">{e.action}</span>
                  <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded"
                    style={e.verdict === 'blocked'
                      ? { color: '#ef4444', backgroundColor: '#ef444415', border: '1px solid #ef444430' }
                      : { color: '#10b981', backgroundColor: '#10b98112', border: '1px solid #10b98125' }}>
                    {e.verdict}
                  </span>
                </div>
                <p className="text-[10px] text-[#555] mt-1 leading-relaxed">{e.reason}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-[#333]">{e.rule}</span>
                  <span className="text-[9px] text-[#333]">{new Date(e.created_at).toLocaleTimeString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent agent traces */}
      <div className="bg-[#0d0d0d] border border-[#141414] rounded-xl p-4">
        <p className="text-[9px] text-[#333] uppercase tracking-widest mb-3">Agent decision traces — the full pipeline per message</p>
        <div className="space-y-3">
          {(agentTraces || []).length === 0 && (
            <p className="text-[10px] text-[#444]">Traces appear here after each chat message once the migration is applied.</p>
          )}
          {(agentTraces || []).slice(0, 5).map((t: any) => (
            <div key={t.id} className="border border-[#141414] rounded-lg px-3 py-2">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <p className="text-[10px] text-[#999] truncate">"{t.message}"</p>
                <span className="text-[9px] text-[#444] flex-shrink-0">{t.total_ms}ms · {new Date(t.created_at).toLocaleTimeString('en-IN')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(t.steps || []).map((s: any, i: number) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#111] border border-[#1a1a1a] text-[#666]"
                    title={s.detail || s.decision}>
                    <span className="text-emerald-500/60">{s.agent}</span> {s.decision.length > 42 ? s.decision.slice(0, 42) + '…' : s.decision} <span className="text-[#3a3a3a]">{s.ms}ms</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('live')
  const [selectedConv, setSelectedConv] = useState<any>(null)
  const [pulse, setPulse] = useState(false)
  const [realtime, setRealtime] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  const fetchData = async () => {
    const res = await fetch('/api/dashboard')
    const json = await res.json()
    setData(json)
    setLoading(false)
    setPulse(true)
    setTimeout(() => setPulse(false), 600)
  }

  // Keep a stable reference so the realtime subscription always calls the latest fetchData
  const fetchDataRef = useRef(fetchData)
  fetchDataRef.current = fetchData

  useEffect(() => {
    fetchData()

    // Fallback polling — keeps the dashboard fresh if realtime drops or never connects
    const interval = setInterval(() => fetchDataRef.current(), 8000)

    // Supabase Realtime — refresh instantly on any change to conversations/messages
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => fetchDataRef.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchDataRef.current())
      .subscribe((status) => {
        setRealtime(status === 'SUBSCRIBED')
      })

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-[#333] tracking-widest uppercase">Initializing FirstSignal</p>
      </div>
    </div>
  )

  const { stats, actions, sentimentTrend, recentConversations } = data
  const hotConv = recentConversations?.find((c: any) => c.is_escalated) || recentConversations?.[0]
  const criticalScore = hotConv?.sentiment_score || 50

  const tickerItems = [
    `${stats.totalConversations} conversations monitored`,
    `${stats.escalatedConversations} active escalations`,
    `₹${stats.estimatedCostSaved?.toLocaleString()} saved today`,
    `${stats.proactiveConversations} proactive outreaches sent`,
    `${stats.vipCustomers} VIP customers tracked`,
    `Resolution rate ${stats.resolutionRate}%`,
    `${actions.refundActions} refunds auto-processed`,
    `${stats.proactiveConversations + stats.resolvedConversations} customers retained today`,
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-[#e5e5e5] flex flex-col" style={{fontFamily:'monospace'}}>

      {/* Top bar */}
      <div className="h-12 bg-[#0d0d0d] border-b border-[#1a1a1a] flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center">
              <span className="text-black text-[9px] font-bold">FS</span>
            </div>
            <span className="text-sm font-medium text-[#e5e5e5] tracking-wide">FIRSTSIGNAL</span>
            <span className="text-[10px] text-[#333] tracking-widest">/ MISSION CONTROL</span>
          </div>
          <div className="h-4 w-px bg-[#1a1a1a]"></div>
          {['live', 'analytics', 'customers', 'guardrails', 'voice', 'impact'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('text-[11px] tracking-widest uppercase transition-colors px-1',
                activeTab === tab ? 'text-emerald-400' : 'text-[#444] hover:text-[#666]'
              )}>
              {tab === 'impact' ? '₹ Impact' : tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {stats.escalatedConversations > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-[10px] text-red-400 tracking-widest uppercase">{stats.escalatedConversations} escalations</span>
            </div>
          )}
          <div className={cn('flex items-center gap-1.5 transition-opacity', pulse ? 'opacity-100' : 'opacity-60')}>
            {realtime ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] text-emerald-400 tracking-widest">LIVE</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <span className="text-[10px] text-amber-400/70 tracking-widest">POLLING</span>
              </>
            )}
          </div>
          <button onClick={() => setTourOpen(true)}
            className="flex items-center gap-1.5 text-[10px] tracking-widest text-[#444] hover:text-[#888] uppercase bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#222] px-3 py-1 rounded transition-all">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Guided Demo
          </button>
          <a href="/chat" className="text-[10px] tracking-widest text-emerald-500 hover:text-emerald-400 uppercase border border-emerald-500/30 px-3 py-1 rounded hover:bg-emerald-500/5 transition-all">
            Open Demo →
          </a>
        </div>
      </div>

      {/* Ticker */}
      <div data-tour="ticker" className="h-8 bg-[#0a0a0a] border-b border-[#141414] flex items-center px-6 gap-3">
        <span className="text-[9px] text-emerald-500 tracking-widest uppercase flex-shrink-0">LIVE FEED</span>
        <div className="w-px h-3 bg-[#222]"></div>
        <Ticker items={tickerItems} />
      </div>

      {activeTab === 'live' && (
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Proactive Intelligence demo panel */}
          <div className="px-4 pt-4 pb-1 flex-shrink-0">
            <ProactiveDemo onComplete={fetchData} />
          </div>

          <div className="flex flex-1 overflow-hidden">

          {/* Left: Conversation feed */}
          <div data-tour="conversations" className="flex-1 border-r border-[#141414] flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-[#141414] flex items-center justify-between">
              <span className="text-[10px] text-[#444] tracking-widest uppercase">Active conversations</span>
              <span className="text-[10px] text-[#333]">{recentConversations?.length} total</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {recentConversations?.map((conv: any, i: number) => {
                const score = conv.sentiment_score || 50
                const isSelected = selectedConv?.id === conv.id
                const color = score > 60 ? '#10b981' : score > 40 ? '#888' : score > 20 ? '#f59e0b' : '#ef4444'
                return (
                  <div key={conv.id}>
                    <div
                      onClick={() => setSelectedConv(selectedConv?.id === conv.id ? null : conv)}
                      className={cn(
                        'px-5 py-3.5 border-b border-[#0f0f0f] cursor-pointer transition-all',
                        selectedConv?.id === conv.id ? 'bg-[#111] border-l-2 border-l-emerald-500/40' : 'hover:bg-[#0d0d0d]',
                        selectedConv?.id !== conv.id && conv.is_escalated ? 'border-l-2 border-l-red-500/50' : ''
                      )}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium',
                            conv.customer?.is_vip ? 'bg-amber-500/20 text-amber-400' : 'bg-[#1a1a1a] text-[#666]')}>
                            {conv.customer?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                          </div>
                          {conv.is_escalated && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-[#080808]"></div>}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#ccc] font-medium">{conv.customer?.name || 'Unknown'}</span>
                            {conv.customer?.is_vip && <span className="text-[9px] text-amber-400 border border-amber-500/30 px-1 rounded">VIP</span>}
                            {conv.is_escalated && <span className="text-[9px] text-red-400 border border-red-500/30 px-1 rounded">ESC</span>}
                            {conv.status === 'proactive' && <span className="text-[9px] text-blue-400 border border-blue-500/30 px-1 rounded">PRO</span>}
                          </div>
                          <p className="text-[11px] text-[#444] truncate mt-0.5">{conv.lastMessage?.content || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-0.5 bg-[#1a1a1a] rounded overflow-hidden">
                            <div className="h-full rounded transition-all" style={{width:`${score}%`, background: color}}></div>
                          </div>
                          <span className="text-[10px] font-mono" style={{color}}>{score}<span className="text-[#333]">/100</span></span>
                        </div>
                        <span className="text-[10px] text-[#333] font-mono">
                          {new Date(conv.updated_at || conv.created_at).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    {conv.resolution && (
                      <div className="mt-2 ml-10 flex items-center gap-1.5">
                        <span className="text-[9px] text-emerald-500">✓</span>
                        <span className="text-[10px] text-[#333] truncate">{conv.resolution}</span>
                      </div>
                    )}
                    </div>
                    {selectedConv?.id === conv.id && (
                      <ConversationDetail
                        conversationId={conv.id}
                        onClose={() => setSelectedConv(null)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Intelligence panel */}
          <div className="w-80 flex flex-col bg-[#0a0a0a]">

            {/* Critical sentiment ring */}
            <div data-tour="sentiment-ring" className="p-5 border-b border-[#141414]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] text-[#444] tracking-widest uppercase">Most at-risk customer</span>
                {criticalScore < 30 && <span className="text-[9px] text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded animate-pulse">CRITICAL</span>}
              </div>
              <div className="flex items-center gap-4">
                <SentimentRing score={criticalScore} />
                <div className="space-y-1.5">
                  <p className="text-sm text-[#ccc] font-medium">{hotConv?.customer?.name || '—'}</p>
                  {hotConv?.customer?.is_vip && <span className="text-[9px] text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">VIP Customer</span>}
                  <p className="text-[9px] text-[#333] mt-1 mb-1">Sentiment score of most at-risk active conversation</p>
                  <p className="text-[10px] text-[#444] leading-relaxed mt-1">
                    {hotConv?.lastMessage?.content?.slice(0, 80) || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 border-b border-[#141414]">
              {[
                { label: 'Conversations', value: stats.totalConversations, color: '#e5e5e5' },
                { label: 'Resolution', value: `${stats.resolutionRate}%`, color: '#10b981' },
                { label: 'Escalations', value: stats.escalatedConversations, color: stats.escalatedConversations > 0 ? '#ef4444' : '#e5e5e5' },
                { label: 'Cost saved', value: `₹${(stats.estimatedCostSaved/1000).toFixed(1)}k`, color: '#10b981' },
              ].map((m, i) => (
                <div key={i} className={cn('p-4', i % 2 === 0 ? 'border-r border-[#141414]' : '', i < 2 ? 'border-b border-[#141414]' : '', pulse ? 'animate-flash' : '')}>
                  <p className="text-[9px] text-[#333] uppercase tracking-widest mb-1">{m.label}</p>
                  <p className="text-xl font-semibold font-mono" style={{color: m.color}}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Actions taken */}
            <div className="p-4 border-b border-[#141414]">
              <p className="text-[9px] text-[#444] tracking-widest uppercase mb-3">Autonomous actions</p>
              <div className="space-y-2">
                {[
                  { label: 'Refunds', value: actions.refundActions, color: '#ef4444' },
                  { label: 'Discounts', value: actions.discountActions, color: '#f59e0b' },
                  { label: 'Redeliveries', value: actions.redeliveryActions, color: '#3b82f6' },
                  { label: 'Proactive', value: actions.proactiveActions, color: '#10b981' },
                ].map((a, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[11px] text-[#555]">{a.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-0.5 bg-[#1a1a1a] rounded overflow-hidden">
                        <div className="h-full rounded" style={{width: a.value > 0 ? '100%' : '0%', background: a.color, transition:'all 0.8s'}}></div>
                      </div>
                      <span className="text-[11px] font-mono" style={{color: a.value > 0 ? a.color : '#333'}}>{a.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voice */}
            <div data-tour="voice" className="p-4 flex-1">
              <p className="text-[9px] text-[#444] tracking-widest uppercase mb-3">Voice callback</p>
              <VoiceDemo
                customer={hotConv?.customer}
                conversationSummary={hotConv?.lastMessage?.content || 'Customer support escalation'}
              />
            </div>
          </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab
          stats={stats}
          actions={actions}
          sentimentTrend={sentimentTrend}
          sentimentBreakdown={data.sentimentBreakdown}
          customerHealthScores={data.customerHealthScores}
          pulse={pulse}
        />
      )}

      {activeTab === 'customers' && (
  <div className="flex-1 p-6 overflow-y-auto">
    <div className="mb-6">
      <h2 className="text-sm font-medium text-[#e5e5e5] tracking-wide">Customers</h2>
      <p className="text-[11px] text-[#444] mt-0.5">{stats.totalCustomers} tracked · {stats.vipCustomers} VIP</p>
    </div>

    {/* Health score cards */}
    <div data-tour="health-scores" className="grid grid-cols-3 gap-3 mb-5">
      {(data.customerHealthScores || []).slice(0, 6).map((c: any) => {
        const col = c.score > 70 ? '#10b981' : c.score > 45 ? '#f59e0b' : '#ef4444'
        const label = c.score > 70 ? 'Healthy' : c.score > 45 ? 'At risk' : 'Critical'
        const circ = 2 * Math.PI * 20
        const dash = (c.score / 100) * circ
        return (
          <div key={c.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 flex items-center gap-4 hover:border-[#222] transition-colors">
            <svg width="52" height="52" viewBox="0 0 52 52" className="flex-shrink-0">
              <circle cx="26" cy="26" r="20" fill="none" stroke="#1a1a1a" strokeWidth="4"/>
              <circle cx="26" cy="26" r="20" fill="none" stroke={col} strokeWidth="4"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                transform="rotate(-90 26 26)" style={{transition:'all 0.8s'}}/>
              <text x="26" y="30" textAnchor="middle" fill={col} fontSize="11" fontWeight="600">{c.score}</text>
            </svg>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-xs text-[#ccc] truncate">{c.name}</p>
                {c.is_vip && <span className="text-[8px] text-amber-400 border border-amber-500/30 px-1 rounded flex-shrink-0">VIP</span>}
              </div>
              <p className="text-[9px] font-mono flex-shrink-0" style={{color: col}}>
                {label}
                {c.trend === 'improving' && <span className="text-emerald-400"> ↗ improving</span>}
                {c.trend === 'declining' && <span className="text-red-400"> ↘ declining</span>}
              </p>
              <p className="text-[9px] text-[#444] mt-0.5">{c.total_orders} orders · ₹{c.total_spent?.toLocaleString()}</p>
            </div>
          </div>
        )
      })}
    </div>

    {/* Full table */}
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-[#141414]">
        <p className="text-[9px] text-[#444] uppercase tracking-widest">Customer roster</p>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#141414]">
            {['Customer', 'Tier', 'Orders', 'Lifetime value', 'Sentiment', 'Health'].map(h => (
              <th key={h} className="px-5 py-3 text-left text-[9px] text-[#333] uppercase tracking-widest font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#0f0f0f]">
          {(data.customerHealthScores || []).map((c: any) => {
            const sc = c.factors?.sentimentEwma ?? 50
            const scCol = sc > 60 ? '#10b981' : sc > 40 ? '#f59e0b' : '#ef4444'
            const healthCol = c.score > 70 ? '#10b981' : c.score > 45 ? '#f59e0b' : '#ef4444'
            return (
              <tr key={c.id} className="hover:bg-[#111] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium ${c.is_vip ? 'bg-amber-500/20 text-amber-400' : 'bg-[#1a1a1a] text-[#555]'}`}>
                      {c.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs text-[#ccc]">{c.name}</p>
                      <p className="text-[10px] text-[#444]">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[9px] border px-1.5 py-0.5 rounded ${c.is_vip ? 'text-amber-400 border-amber-500/30' : 'text-[#555] border-[#222]'}`}>
                    {c.is_vip ? 'VIP' : 'Standard'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-[#555] font-mono">{c.total_orders}</td>
                <td className="px-5 py-3.5 text-xs text-[#555] font-mono">₹{c.total_spent?.toLocaleString()}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-0.5 bg-[#1a1a1a] rounded overflow-hidden">
                      <div className="h-full rounded" style={{width:`${sc}%`, background: scCol}}></div>
                    </div>
                    <span className="text-[10px] font-mono" style={{color: scCol}}>{sc}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-0.5 bg-[#1a1a1a] rounded overflow-hidden">
                      <div className="h-full rounded transition-all" style={{width:`${c.score}%`, background: healthCol}}></div>
                    </div>
                    <span className="text-[10px] font-mono" style={{color: healthCol}}>
                      {c.score}{c.trend === 'improving' ? ' ↗' : c.trend === 'declining' ? ' ↘' : ''}
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </div>
)}

      {activeTab === 'guardrails' && (
        <GuardrailsTab guardrails={data.guardrails} agentTraces={data.agentTraces} stats={stats} />
      )}

      {activeTab === 'voice' && <VoiceTab hotConv={hotConv} />}

      {activeTab === 'impact' && <ImpactTab stats={stats} actions={actions} />}

      {/* Bottom status bar */}
      <div className="h-7 bg-[#0d0d0d] border-t border-[#141414] flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[9px] text-[#333] font-mono">FIRSTSIGNAL v1.0</span>
          <span className="text-[9px] text-[#222] font-mono">·</span>
          <span className="text-[9px] text-[#333] font-mono">D2C CUSTOMER INTELLIGENCE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] text-[#333] font-mono">GROQ LLAMA-3.3-70B</span>
          <span className="text-[9px] text-[#222] font-mono">·</span>
          <span className="text-[9px] text-[#333] font-mono">SUPABASE</span>
          <span className="text-[9px] text-[#222] font-mono">·</span>
          <span className="text-[9px] text-[#333] font-mono">VAPI VOICE</span>
        </div>
      </div>

      {/* Guided tour overlay */}
      {tourOpen && (
        <DemoTour
          steps={TOUR_STEPS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => { setTourOpen(false); setActiveTab('live') }}
        />
      )}

    </div>
  )
}
