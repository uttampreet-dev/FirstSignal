'use client'
import { useState, useEffect } from 'react'
import Vapi from '@vapi-ai/web'

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!)

export default function VoiceDemo({ customer, conversationSummary }: {
  customer: any
  conversationSummary: string
}) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle')
  const [transcript, setTranscript] = useState<string[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    vapi.on('call-start', () => { setStatus('active'); setError(null) })
    vapi.on('call-end', () => setStatus('ended'))
    vapi.on('speech-start', () => setIsSpeaking(true))
    vapi.on('speech-end', () => setIsSpeaking(false))
    vapi.on('error', (e: any) => {
      setError(JSON.stringify(e) || 'Call failed')
      setStatus('idle')
    })
    vapi.on('message', (msg: any) => {
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        setTranscript(prev => [...prev, `${msg.role === 'assistant' ? 'Aria' : 'You'}: ${msg.transcript}`])
      }
    })
    return () => { vapi.stop() }
  }, [])

  const startCall = async () => {
    setStatus('connecting')
    setTranscript([])
    setError(null)
    await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
      variableValues: {
        customerName: customer?.name || 'Customer',
        isVip: customer?.is_vip ? 'VIP customer' : 'Standard customer',
        context: conversationSummary || 'Customer had a support issue'
      }
    })
  }

  const endCall = () => { vapi.stop(); setStatus('ended') }

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-[#e5e5e5]">AI Voice Callback</p>
          <p className="text-xs text-[#555]">Aria speaks directly from browser</p>
        </div>
        {status === 'active' && (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-[#444]'}`}></div>
            <span className="text-xs text-[#666]">{isSpeaking ? 'Aria speaking...' : 'Listening...'}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400 break-all">{error}</p>
        </div>
      )}

      {status === 'idle' && (
        <button onClick={startCall} className="w-full py-2.5 bg-emerald-500 text-black text-sm rounded-lg hover:bg-emerald-400 transition-colors font-medium">
          Start Voice Callback Demo
        </button>
      )}

      {status === 'connecting' && (
        <div className="w-full py-2.5 bg-[#1a1a1a] text-[#666] text-sm rounded-lg text-center flex items-center justify-center gap-2">
          <div className="w-3 h-3 border border-[#555] border-t-transparent rounded-full animate-spin"></div>
          Connecting to Aria...
        </div>
      )}

      {status === 'active' && (
        <div className="space-y-3">
          <div className="bg-[#1a1a1a] rounded-lg p-3 max-h-40 overflow-y-auto space-y-1 min-h-16">
            {transcript.length === 0 ? (
              <p className="text-xs text-[#444] text-center pt-2">Transcript will appear here...</p>
            ) : (
              transcript.map((line, i) => (
                <p key={i} className={`text-xs ${line.startsWith('Aria') ? 'text-emerald-400 font-medium' : 'text-[#888]'}`}>
                  {line}
                </p>
              ))
            )}
          </div>
          <button onClick={endCall} className="w-full py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition-colors">
            End Call
          </button>
        </div>
      )}

      {status === 'ended' && (
        <div className="space-y-3">
          {transcript.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
              {transcript.map((line, i) => (
                <p key={i} className={`text-xs ${line.startsWith('Aria') ? 'text-emerald-400 font-medium' : 'text-[#888]'}`}>
                  {line}
                </p>
              ))}
            </div>
          )}
          <div className="px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
            <p className="text-xs text-emerald-400">✓ Call completed</p>
          </div>
          <button onClick={() => { setStatus('idle'); setTranscript([]) }} className="w-full py-2.5 bg-[#1a1a1a] text-[#666] text-sm rounded-lg hover:bg-[#222] transition-colors">
            Start New Call
          </button>
        </div>
      )}
    </div>
  )
}