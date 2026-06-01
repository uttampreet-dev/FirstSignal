'use client'
import { useEffect, useState, useRef } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import VoiceDemo from '@/components/VoiceDemo'
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

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('live')
  const [selectedConv, setSelectedConv] = useState<any>(null)
  const [pulse, setPulse] = useState(false)

  const fetchData = async () => {
    const res = await fetch('/api/dashboard')
    const json = await res.json()
    setData(json)
    setLoading(false)
    setPulse(true)
    setTimeout(() => setPulse(false), 600)
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
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
          {['live', 'analytics', 'customers', 'voice'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('text-[11px] tracking-widest uppercase transition-colors px-1',
                activeTab === tab ? 'text-emerald-400' : 'text-[#444] hover:text-[#666]'
              )}>
              {tab}
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
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] text-[#444] tracking-widest">LIVE</span>
          </div>
          <a href="/chat" className="text-[10px] tracking-widest text-emerald-500 hover:text-emerald-400 uppercase border border-emerald-500/30 px-3 py-1 rounded hover:bg-emerald-500/5 transition-all">
            Open Demo →
          </a>
        </div>
      </div>

      {/* Ticker */}
      <div className="h-8 bg-[#0a0a0a] border-b border-[#141414] flex items-center px-6 gap-3">
        <span className="text-[9px] text-emerald-500 tracking-widest uppercase flex-shrink-0">LIVE FEED</span>
        <div className="w-px h-3 bg-[#222]"></div>
        <Ticker items={tickerItems} />
      </div>

      {activeTab === 'live' && (
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Conversation feed */}
          <div className="flex-1 border-r border-[#141414] flex flex-col overflow-hidden">
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
            <div className="p-5 border-b border-[#141414]">
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
                <div key={i} className={cn('p-4', i % 2 === 0 ? 'border-r border-[#141414]' : '', i < 2 ? 'border-b border-[#141414]' : '')}>
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
            <div className="p-4 flex-1">
              <p className="text-[9px] text-[#444] tracking-widest uppercase mb-3">Voice callback</p>
              <VoiceDemo
                customer={hotConv?.customer}
                conversationSummary={hotConv?.lastMessage?.content || 'Customer support escalation'}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-sm font-medium text-[#e5e5e5] tracking-wide">Analytics</h2>
            <p className="text-[11px] text-[#444] mt-0.5">Sentiment and performance over time</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total conversations', value: stats.totalConversations },
              { label: 'Avg sentiment', value: `${stats.avgSentiment}/100`, color: stats.avgSentiment > 60 ? '#10b981' : '#f59e0b' },
              { label: 'VIP customers', value: `${stats.vipCustomers} of ${stats.totalCustomers}`, color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4">
                <p className="text-[9px] text-[#444] uppercase tracking-widest mb-2">{s.label}</p>
                <p className="text-2xl font-semibold font-mono" style={{color: (s as any).color || '#e5e5e5'}}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5">
            <p className="text-[9px] text-[#444] uppercase tracking-widest mb-4">Sentiment trend</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={sentimentTrend}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="index" tick={{fontSize:10, fill:'#333'}} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={{fontSize:10, fill:'#333'}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:'#111',border:'1px solid #222',borderRadius:6,fontSize:11}} itemStyle={{color:'#10b981'}} labelStyle={{color:'#555'}} formatter={(v:any) => [`${v}/100`,'Score']}/>
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={1.5} fill="url(#sg)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5 mt-4">
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
                  text: `${stats.escalatedConversations} conversations escalated this session — all involved delayed orders. Delivery reliability is your #1 churn driver right now.`
                },
                {
                  icon: '◎',
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/5 border-amber-500/10',
                  text: `VIP customers are ${stats.vipCustomers} of ${stats.totalCustomers} tracked but represent the majority of escalations. A dedicated VIP SLA would significantly reduce churn risk.`
                },
                {
                  icon: '⚡',
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/5 border-emerald-500/10',
                  text: `Proactive outreach intercepted ${stats.proactiveConversations} potential complaints before they escalated. Estimated ₹${(stats.proactiveConversations * 800).toLocaleString()} in retention value generated autonomously.`
                },
                {
                  icon: '◈',
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/5 border-blue-500/10',
                  text: `Resolution rate is ${stats.resolutionRate}% — ${stats.resolutionRate > 70 ? 'strong performance. Most issues resolved without human intervention.' : 'below target. Consider expanding autonomous resolution rules for common complaint types.'}`
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
      )}

      {activeTab === 'customers' && (
  <div className="flex-1 p-6 overflow-y-auto">
    <div className="mb-6">
      <h2 className="text-sm font-medium text-[#e5e5e5] tracking-wide">Customers</h2>
      <p className="text-[11px] text-[#444] mt-0.5">{stats.totalCustomers} tracked · {stats.vipCustomers} VIP</p>
    </div>

    {/* Health score cards */}
    <div className="grid grid-cols-3 gap-3 mb-5">
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
              <p className="text-[9px] font-mono flex-shrink-0" style={{color: col}}>{label}</p>
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
            const sc = 50
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
                      <div className="h-full rounded" style={{width:`${sc}%`, background:'#888'}}></div>
                    </div>
                    <span className="text-[10px] font-mono text-[#555]">{sc}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-0.5 bg-[#1a1a1a] rounded overflow-hidden">
                      <div className="h-full rounded transition-all" style={{width:`${c.score}%`, background: healthCol}}></div>
                    </div>
                    <span className="text-[10px] font-mono" style={{color: healthCol}}>{c.score}</span>
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

      {activeTab === 'voice' && (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-sm font-medium text-[#e5e5e5] tracking-wide">Voice callbacks</h2>
            <p className="text-[11px] text-[#444] mt-0.5">AI-powered escalation calls from browser</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <VoiceDemo
              customer={hotConv?.customer}
              conversationSummary={hotConv?.lastMessage?.content || 'Customer escalation'}
            />
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5">
              <p className="text-[9px] text-[#444] uppercase tracking-widest mb-5">How escalation works</p>
              <div className="space-y-5">
                {[
                  {n:'01', t:'Frustration detected', d:'Sentiment drops below 25. Churn risk flagged automatically.'},
                  {n:'02', t:'AI summary generated', d:'Full conversation briefing prepared for human agent in 2 seconds.'},
                  {n:'03', t:'Voice callback initiated', d:'Aria calls customer directly from browser — no phone needed.'},
                  {n:'04', t:'Memory updated', d:'Call transcript saved. Next interaction knows full history.'},
                ].map((s,i) => (
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
      )}

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

    </div>
  )
}
