import { supabaseAdmin } from '@/lib/supabase'
import { buildSystemPrompt } from '@/lib/system-prompt'
import { analyzeSentiment } from '@/lib/sentiment'
import { getMemories, extractAndSaveMemory } from '@/lib/memory'
import { detectAction } from '@/lib/action-detector'
import { processRefund, applyDiscount, markRedelivery, escalateToHuman } from '@/lib/resolution'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message, customerId, conversationId } = await req.json()

    const { data: customer } = await supabaseAdmin.from('customers').select('*').eq('id', customerId).single()
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const { data: orders } = await supabaseAdmin.from('orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(3)

    let convId = conversationId
    if (!convId) {
      const { data: newConv } = await supabaseAdmin.from('conversations').insert({ customer_id: customerId }).select().single()
      convId = newConv?.id
    }

    const { data: history } = await supabaseAdmin.from('messages').select('role, content').eq('conversation_id', convId).order('created_at', { ascending: true }).limit(20)

    const [memories, sentimentResult] = await Promise.all([
      getMemories(customerId, 5),
      analyzeSentiment(message)
    ])

    const Groq = (await import('groq-sdk')).default
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

    const allMessages = [
      { role: 'system' as const, content: buildSystemPrompt(customer, orders || [], memories) },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: allMessages,
      max_tokens: 1000
    })

    const aiReply = completion.choices[0].message.content || ''
    const shouldEscalate = sentimentResult.score < 25 || sentimentResult.churnRisk

    // Detect and execute action
    const detectedAction = await detectAction(message, aiReply, sentimentResult)
    let resolutionResult = null

    if (detectedAction.action === 'process_refund' && orders?.[0]) {
      resolutionResult = await processRefund(
        customerId,
        detectedAction.orderId || orders[0].order_number,
        'Customer requested refund'
      )
    } else if (detectedAction.action === 'apply_discount') {
      resolutionResult = await applyDiscount(
        customerId,
        detectedAction.discountPercentage || 15
      )
    } else if (detectedAction.action === 'mark_redelivery' && orders?.[0]) {
      resolutionResult = await markRedelivery(
        customerId,
        detectedAction.orderId || orders[0].order_number
      )
    } else if (detectedAction.action === 'escalate_to_human' || shouldEscalate) {
      resolutionResult = await escalateToHuman(
        customerId,
        convId,
        detectedAction.reason || 'High frustration detected',
        sentimentResult
      )
    }

    // Save everything
    await Promise.all([
      supabaseAdmin.from('messages').insert({ conversation_id: convId, role: 'user', content: message, sentiment: sentimentResult.label }),
      supabaseAdmin.from('messages').insert({ conversation_id: convId, role: 'assistant', content: aiReply }),
      supabaseAdmin.from('conversations').update({
        updated_at: new Date().toISOString(),
        sentiment: sentimentResult.label,
        sentiment_score: sentimentResult.score,
        is_escalated: shouldEscalate,
        resolution: resolutionResult?.message || null
      }).eq('id', convId),
      supabaseAdmin.from('customers').update({
        sentiment_score: Math.round((customer.sentiment_score + sentimentResult.score) / 2)
      }).eq('id', customerId),
      extractAndSaveMemory(customerId, message, aiReply, sentimentResult)
    ])

    return NextResponse.json({
      reply: aiReply,
      conversationId: convId,
      sentiment: sentimentResult,
      isEscalated: shouldEscalate,
      memoriesUsed: memories.length,
      action: resolutionResult
    })

  } catch (error) {
    console.error('CHAT ERROR:', error)
    return NextResponse.json({ error: 'Something went wrong', detail: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
