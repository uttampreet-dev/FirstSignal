import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

function calculateHealthScore(customer: any, conversations: any[]) {
  const customerConvs = conversations.filter((c: any) => c.customer_id === customer.id)
  const avgSentiment = customerConvs.length > 0
    ? customerConvs.reduce((sum: number, c: any) => sum + (c.sentiment_score || 50), 0) / customerConvs.length
    : 50
  const escalationPenalty = customerConvs.filter((c: any) => c.is_escalated).length * 10
  const orderBonus = Math.min(customer.total_orders * 3, 20)
  const spendBonus = customer.total_spent > 10000 ? 10 : customer.total_spent > 5000 ? 5 : 0
  return Math.max(0, Math.min(100, Math.round(avgSentiment + orderBonus + spendBonus - escalationPenalty)))
}
export async function GET() {
  try {
    // Fetch all data in parallel
    const [
      { data: conversations },
      { data: messages },
      { data: customers },
      { data: orders },
      { data: memories }
    ] = await Promise.all([
      supabaseAdmin.from('conversations').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('messages').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('customers').select('*'),
      supabaseAdmin.from('orders').select('*'),
      supabaseAdmin.from('memory_embeddings').select('*').order('created_at', { ascending: false }).limit(50)
    ])

    const totalConversations = conversations?.length || 0
    const escalatedConversations = conversations?.filter(c => c.is_escalated).length || 0
    const resolvedConversations = conversations?.filter(c => c.resolution).length || 0
    const proactiveConversations = conversations?.filter(c => c.status === 'proactive').length || 0

    const resolutionRate = totalConversations > 0
      ? Math.round((resolvedConversations / totalConversations) * 100)
      : 0

    const avgSentiment = conversations && conversations.length > 0
      ? Math.round(conversations.reduce((sum, c) => sum + (c.sentiment_score || 50), 0) / conversations.length)
      : 50

    const sentimentBreakdown = {
      positive: conversations?.filter(c => (c.sentiment_score || 50) > 60).length || 0,
      neutral: conversations?.filter(c => (c.sentiment_score || 50) >= 40 && (c.sentiment_score || 50) <= 60).length || 0,
      negative: conversations?.filter(c => (c.sentiment_score || 50) >= 20 && (c.sentiment_score || 50) < 40).length || 0,
      frustrated: conversations?.filter(c => (c.sentiment_score || 50) < 20).length || 0,
    }

    const refundActions = memories?.filter(m => m.metadata?.action === 'refund').length || 0
    const discountActions = memories?.filter(m => m.metadata?.action === 'discount').length || 0
    const redeliveryActions = memories?.filter(m => m.metadata?.action === 'redelivery').length || 0
    const proactiveActions = memories?.filter(m => m.metadata?.action === 'proactive_outreach').length || 0

    const estimatedCostSaved = (resolvedConversations * 450) + (proactiveActions * 800)

    // Recent conversations for inbox
    const recentConversations = await Promise.all(
      (conversations || []).slice(0, 10).map(async (conv) => {
        const { data: customer } = await supabaseAdmin
          .from('customers').select('name, email, is_vip, sentiment_score')
          .eq('id', conv.customer_id).single()
        const { data: lastMsg } = await supabaseAdmin
          .from('messages').select('content, role, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1).single()
        return { ...conv, customer, lastMessage: lastMsg }
      })
    )

    // Sentiment trend (last 7 conversations)
    const sentimentTrend = (conversations || []).slice(0, 7).reverse().map((c, i) => ({
      index: i + 1,
      score: c.sentiment_score || 50,
      label: c.sentiment || 'neutral'
    }))

    const customerHealthScores = (customers || []).map((c: any) => ({
  id: c.id,
  name: c.name,
  score: calculateHealthScore(c, conversations || []),
  is_vip: c.is_vip,
  total_orders: c.total_orders,
  total_spent: c.total_spent,
  email: c.email
}))

return NextResponse.json({
  stats: {
    totalConversations,
    escalatedConversations,
    resolvedConversations,
    proactiveConversations,
    resolutionRate,
    avgSentiment,
    estimatedCostSaved,
    totalCustomers: customers?.length || 0,
    vipCustomers: customers?.filter((c: any) => c.is_vip).length || 0,
  },
  actions: { refundActions, discountActions, redeliveryActions, proactiveActions },
  sentimentBreakdown,
  sentimentTrend,
  recentConversations,
  orders: orders || [],
  customerHealthScores
})
  } catch (error) {
    console.error('DASHBOARD ERROR:', error)
    return NextResponse.json({ error: 'Failed', detail: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
