'use client'
import { useState } from 'react'
import ChatWidget from '@/components/chat/ChatWidget'
import { BRANDS, DEFAULT_BRAND_ID, getBrand } from '@/lib/brands'

function cn(...c: string[]) { return c.filter(Boolean).join(' ') }

export default function ChatPage() {
  const [brandId, setBrandId] = useState(DEFAULT_BRAND_ID)
  const [resetting, setResetting] = useState(false)
  const brand = getBrand(brandId)
  const currentOrder = brand.sampleOrders[0]

  const statusColor = (status: string) =>
    status === 'Delayed' ? '#ef4444' : status === 'Delivered' ? '#10b981' : '#f59e0b'

  // Clears the demo customer's history/memory and reloads — a clean slate for the next take
  const resetDemo = async () => {
    if (resetting) return
    setResetting(true)
    try { await fetch('/api/demo/reset-chat', { method: 'POST' }) } catch {}
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center p-6" style={{ fontFamily: 'monospace' }}>

      {/* Brand switcher bar */}
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#333] uppercase tracking-widest mr-1">Client</span>
          {BRANDS.map(b => {
            const active = b.id === brandId
            return (
              <button
                key={b.id}
                onClick={() => setBrandId(b.id)}
                className={cn(
                  'flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border transition-all',
                  active ? 'bg-[#0d0d0d]' : 'border-[#1a1a1a] hover:border-[#222] opacity-70 hover:opacity-100'
                )}
                style={active ? { borderColor: `${b.primaryColor}66`, backgroundColor: `${b.primaryColor}0d` } : {}}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{ backgroundColor: `${b.primaryColor}22`, color: b.primaryColor }}
                >
                  {b.logo}
                </span>
                <span className="text-[11px]" style={{ color: active ? b.primaryColor : '#666' }}>{b.name}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Reset demo — clean slate between recording takes */}
          <button
            onClick={resetDemo}
            disabled={resetting}
            title="Reset the demo customer to a clean state"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#141414] text-[#444] hover:text-[#888] hover:border-[#222] transition-colors disabled:opacity-50"
          >
            <span className={cn('text-[10px]', resetting ? 'animate-spin' : '')}>↻</span>
            <span className="text-[10px] font-mono uppercase tracking-widest">{resetting ? 'Resetting' : 'Reset'}</span>
          </button>

          {/* Serving X brands counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0d0d0d] border border-[#141414] rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] text-[#888] font-mono">
              Serving <span className="text-emerald-400">{BRANDS.length}</span> brands
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-4xl">

        {/* Context panel */}
        <div className="w-64 flex-shrink-0 space-y-3">
          <div className="bg-[#0d0d0d] border border-[#141414] rounded-xl p-4">
            <p className="text-[9px] text-[#333] uppercase tracking-widest mb-3">Customer profile</p>
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ backgroundColor: `${brand.primaryColor}22`, borderColor: `${brand.primaryColor}33` }}
              >
                <span className="text-xs" style={{ color: brand.primaryColor }}>{brand.customer.initials}</span>
              </div>
              <div>
                <p className="text-xs text-[#ccc]">{brand.customer.name}</p>
                {brand.customer.isVip && (
                  <span className="text-[9px] text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">VIP</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Total orders', value: String(brand.customer.totalOrders) },
                { label: 'Lifetime value', value: brand.customer.lifetimeValue },
                { label: 'Sentiment', value: `${brand.customer.sentiment}/100` },
              ].map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-[10px] text-[#444]">{item.label}</span>
                  <span className="text-[10px] text-[#888] font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-[#141414] rounded-xl p-4">
            <p className="text-[9px] text-[#333] uppercase tracking-widest mb-3">Current order</p>
            <p className="text-xs text-[#ccc] font-mono">{currentOrder.order_number}</p>
            <p className="text-[10px] text-[#555] mt-1">{currentOrder.items}</p>
            <div
              className="mt-2 px-2 py-1 rounded inline-block"
              style={{ backgroundColor: `${statusColor(currentOrder.status)}1a`, border: `1px solid ${statusColor(currentOrder.status)}33` }}
            >
              <span className="text-[9px] uppercase tracking-widest" style={{ color: statusColor(currentOrder.status) }}>
                {currentOrder.status}
              </span>
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-[#141414] rounded-xl p-4">
            <p className="text-[9px] text-[#333] uppercase tracking-widest mb-3">How to demo</p>
            <div className="space-y-2">
              {brand.commonIssues.map((tip, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-[9px] text-emerald-500/50 font-mono mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[10px] text-[#444]">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat widget — keyed by brand so it remounts cleanly with a fresh greeting */}
        <div className="flex-1 h-[680px] bg-[#080808] border border-[#141414] rounded-2xl overflow-hidden">
          <ChatWidget key={brand.id} brand={brand} />
        </div>
      </div>
    </div>
  )
}
