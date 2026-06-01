import { supabaseAdmin } from '@/lib/supabase'
import Groq from 'groq-sdk'
import { NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(req: Request) {
  try {
    const { conversationId } = await req.json()

    // Fetch full conversation
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Fetch customer
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', conversation.customer_id)
      .single()

    // Fetch messages
    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    // Fetch customer orders
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customer_id', conversation.customer_id)
      .order('created_at', { ascending: false })
      .limit(3)

    // Fetch customer memories
    const { data: memories } = await supabaseAdmin
      .from('memory_embeddings')
      .select('*')
      .eq('customer_id', conversation.customer_id)
      .order('created_at', { ascending: false })
      .limit(10)

    const conversationText = messages?.map(m =>
      `${m.role === 'user' ? customer?.name : 'Aria (AI)'}: ${m.content}`
    ).join('\n')

    const memoryText = memories?.map(m => m.content).join('\n') || 'No previous history'

    // Generate AI summary
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a senior support manager. Generate a concise escalation briefing for a human agent.
Respond ONLY with a JSON object in this exact format:
{
  "issueSummary": "2 sentence summary of the problem",
  "customerProfile": "1 sentence about customer value and history",
  "sentimentAssessment": "current emotional state and urgency level",
  "actionsAlreadyTaken": ["action 1", "action 2"],
  "suggestedResolution": "specific recommended next step",
  "urgencyLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "estimatedHandleTime": "X minutes"
}`
        },
        {
          role: 'user',
          content: `CUSTOMER: ${customer?.name}, VIP: ${customer?.is_vip}, Orders: ${customer?.total_orders}, Spent: ₹${customer?.total_spent}
          
RECENT ORDERS:
${orders?.map(o => `${o.order_number}: ${o.status}, ₹${o.amount}`).join('\n')}

CONVERSATION:
${conversationText}

PAST HISTORY:
${memoryText}`
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    })

    const text = completion.choices[0].message.content || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    const summary = JSON.parse(clean)

    // Save summary to conversation
    await supabaseAdmin
      .from('conversations')
      .update({ resolution: summary.issueSummary })
      .eq('id', conversationId)

    return NextResponse.json({
      success: true,
      summary,
      customer,
      orders,
      conversationId
    })

  } catch (error) {
    console.error('ESCALATION ERROR:', error)
    return NextResponse.json({
      error: 'Failed',
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
