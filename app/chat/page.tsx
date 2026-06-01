import ChatWidget from '@/components/chat/ChatWidget'

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
      <div className="flex gap-4 w-full max-w-4xl">

        {/* Context panel */}
        <div className="w-64 flex-shrink-0 space-y-3">
          <div className="bg-[#0d0d0d] border border-[#141414] rounded-xl p-4">
            <p className="text-[9px] text-[#333] uppercase tracking-widest mb-3">Customer profile</p>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 text-xs">PS</span>
              </div>
              <div>
                <p className="text-xs text-[#ccc]">Priya Sharma</p>
                <span className="text-[9px] text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">VIP</span>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Total orders', value: '8' },
                { label: 'Lifetime value', value: '₹12,400' },
                { label: 'Sentiment', value: '30/100' },
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
            <p className="text-xs text-[#ccc] font-mono">ORD-2847</p>
            <p className="text-[10px] text-[#555] mt-1">Blue Kurta Set, Cotton Dupatta</p>
            <div className="mt-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded inline-block">
              <span className="text-[9px] text-red-400 uppercase tracking-widest">Delayed</span>
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-[#141414] rounded-xl p-4">
            <p className="text-[9px] text-[#333] uppercase tracking-widest mb-3">How to demo</p>
            <div className="space-y-2">
              {[
                'Ask about your order',
                'Say you\'re frustrated',
                'Mention a wedding/event',
                'Request a refund',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-[9px] text-emerald-500/50 font-mono mt-0.5">{String(i+1).padStart(2,'0')}</span>
                  <span className="text-[10px] text-[#444]">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat widget */}
        <div className="flex-1 h-[680px] bg-[#080808] border border-[#141414] rounded-2xl overflow-hidden">
          <ChatWidget />
        </div>
      </div>
    </div>
  )
}
