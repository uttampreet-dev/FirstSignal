import { NextResponse } from 'next/server'
import { runPipeline, type PipelineEvent } from '@/lib/orchestrator'

// Chat endpoint — thin wrapper around the agent orchestrator.
// Send `Accept: text/event-stream` to stream the pipeline live: agent steps
// appear as they execute and reply tokens arrive as they're generated,
// followed by a final `done` event with the full result (trace, guardrails,
// sentiment, action). Without that header it behaves as a plain JSON endpoint
// (used by scripts and integrations).

export const maxDuration = 60

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { message, customerId, conversationId, brandId } = body
  if (!message || !customerId) {
    return NextResponse.json({ error: 'message and customerId are required' }, { status: 400 })
  }

  const wantsStream = (req.headers.get('accept') || '').includes('text/event-stream')

  if (!wantsStream) {
    try {
      const result = await runPipeline({ message, customerId, conversationId, brandId })
      return NextResponse.json(result)
    } catch (error: any) {
      return errorResponse(error)
    }
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: PipelineEvent | { type: 'done'; result: any } | { type: 'error'; message: string }) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }
      try {
        const result = await runPipeline({ message, customerId, conversationId, brandId }, send)
        send({ type: 'done', result })
      } catch (error: any) {
        console.error('CHAT STREAM ERROR:', error)
        if (isRateLimit(error)) {
          send({ type: 'done', result: rateLimitResult(conversationId) })
        } else {
          send({ type: 'error', message: error?.status === 404 ? 'Customer not found' : 'Something went wrong' })
        }
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  })
}

function errorResponse(error: any) {
  if (error?.status === 404) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }
  if (isRateLimit(error)) {
    return NextResponse.json(rateLimitResult(null))
  }
  console.error('CHAT ERROR:', error)
  return NextResponse.json(
    { error: 'Something went wrong', detail: error instanceof Error ? error.message : String(error) },
    { status: 500 }
  )
}

function isRateLimit(error: any) {
  return error?.status === 429 || /rate.?limit/i.test(String(error?.message || ''))
}

// LLM capacity exhausted — degrade to a human-sounding reply instead of a 500,
// so a busy live demo never shows a raw error to the customer.
function rateLimitResult(conversationId: string | null) {
  return {
    reply: "I'm handling a surge of conversations right now — please give me just a minute and send that again. Your conversation is safe with me.",
    conversationId,
    sentiment: null,
    isEscalated: false,
    memoriesUsed: 0,
    memoryMode: 'recency',
    action: null,
    guardrails: [],
    injectionFlagged: false,
    detectedLanguage: 'english',
    trace: { steps: [{ agent: 'System', decision: 'LLM capacity limit hit — replied with a hold message, no state changed', ms: 0 }], totalMs: 0 },
    rateLimited: true
  }
}
