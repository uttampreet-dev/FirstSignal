'use client'
import { useState } from 'react'
import { Send } from 'lucide-react'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
  }

  return (
    <div className="flex items-center gap-2 p-3 border-t border-gray-100">
      <input
        className="flex-1 text-sm px-4 py-2.5 rounded-full border border-gray-200 outline-none focus:border-violet-400 transition-colors"
        placeholder="Type your message..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSend()}
        disabled={disabled}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white disabled:opacity-40 hover:bg-violet-700 transition-colors flex-shrink-0"
      >
        <Send size={15} />
      </button>
    </div>
  )
}