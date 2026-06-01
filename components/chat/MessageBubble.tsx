import { cn } from '@/lib/utils'

interface Message {
  role: string
  content: string
}

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex w-full mb-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-medium text-violet-700 mr-2 flex-shrink-0 mt-1">
          A
        </div>
      )}

      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-violet-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        )}
      >
        {message.content}
      </div>
    </div>
  )
}