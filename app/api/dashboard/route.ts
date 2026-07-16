import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { computeHealth } from '@/lib/health'
import { POLICY } from '@/lib/guardrails'

export async function GET() {
  try {
    // Fetch all data in parallel (new tables fail soft if the migration hasn't run)
    const [
      { data: conversations },
      { data: messages },
      { data: customers },
      { data: orders },
      { data: memories },
      guardrailRes,
      tracesRes,
      ledgerRes
    ] = await Promise.all([
      supabaseAdmin.from('conversations').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('messages').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('customers').select('*'),
      supabaseAdmin.from('orders').select('*'),
      supabaseAdmin.from('memory_embeddings').select('id, customer_id, content, metadata, created_at').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('guardrail_events').select('*').order('created_at', { ascending: false }).limit(30),
      supabaseAdmin.from('agent_traces').select('*').order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('resolution_actions').select('*').order('created_at', { ascending: false }).limit(50)
    ])
    const guardrailEvents = guardrailRes.error ? [] : (guardrailRes.data || [])
    const agentTraces = tracesRes.error ? [] : (tracesRes.data || [])
    const resolutionLedger = ledgerRes.error ? [] : (ledgerRes.data || [])

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

    // In-memory lookups (no per-conversation queries)
    const customerById = new Map((customers || []).map((c: any) => [c.id, c]))
    const messagesByConv = new Map<string, any[]>()
    for (const m of messages || []) {
      const list = messagesByConv.get(m.conversation_id) || []
      list.push(m) // messages are sorted newest-first
      messagesByConv.set(m.conversation_id, list)
    }

    const recentConversations = (conversations || []).slice(0, 10).map(conv => {
      const customer = customerById.get(conv.customer_id)
      const lastMessage = (messagesByConv.get(conv.id) || [])[0] || null
      return {
        ...conv,
        customer: customer
          ? { name: customer.name, email: customer.email, is_vip: customer.is_vip, sentiment_score: customer.sentiment_score }
          : null,
        lastMessage: lastMessage
          ? { content: lastMessage.content, role: lastMessage.role, created_at: lastMessage.created_at }
          : null
      }
    })

    // Sentiment trend (last 7 conversations)
    const sentimentTrend = (conversations || []).slice(0, 7).reverse().map((c, i) => ({
      index: i + 1,
      score: c.sentiment_score || 50,
      label: c.sentiment || 'neutral'
    }))

    // Health trajectory per customer — EWMA over per-message sentiment history
    const convsByCustomer = new Map<string, any[]>()
    for (const c of conversations || []) {
      const list = convsByCustomer.get(c.customer_id) || []
      list.push(c)
      convsByCustomer.set(c.customer_id, list)
    }
    const convCustomer = new Map((conversations || []).map((c: any) => [c.id, c.customer_id]))
    const seriesByCustomer = new Map<string, number[]>()
    for (const m of (messages || []).slice().reverse()) { // oldest → newest
      if (m.role !== 'user' || typeof m.sentiment_score !== 'number') continue
      const custId = convCustomer.get(m.conversation_id)
      if (!custId) continue
      const list = seriesByCustomer.get(custId) || []
      list.push(m.sentiment_score)
      seriesByCustomer.set(custId, list)
    }

    const customerHealthScores = (customers || []).map((c: any) => {
      const health = computeHealth({
        customer: c,
        conversations: convsByCustomer.get(c.id) || [],
        sentimentSeries: seriesByCustomer.get(c.id) || [],
        orders: (orders || []).filter((o: any) => o.customer_id === c.id)
      })
      return {
        id: c.id,
        name: c.name,
        score: health.score,
        trend: health.trend,
        series: health.series,
        factors: health.factors,
        is_vip: c.is_vip,
        total_orders: c.total_orders,
        total_spent: c.total_spent,
        email: c.email
      }
    })

    // Guardrail stats
    const guardrailStats = {
      total: guardrailEvents.length,
      blocked: guardrailEvents.filter((e: any) => e.verdict === 'blocked').length,
      allowed: guardrailEvents.filter((e: any) => e.verdict === 'allowed').length,
    }

    // Pipeline latency from recent traces
    const avgPipelineMs = agentTraces.length > 0
      ? Math.round(agentTraces.reduce((s: number, t: any) => s + (t.total_ms || 0), 0) / agentTraces.length)
      : null

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
        avgPipelineMs,
      },
      actions: { refundActions, discountActions, redeliveryActions, proactiveActions },
      sentimentBreakdown,
      sentimentTrend,
      recentConversations,
      orders: orders || [],
      customerHealthScores,
      guardrails: { stats: guardrailStats, events: guardrailEvents, policy: POLICY },
      agentTraces,
      resolutionLedger
    })
  } catch (error) {
    console.error('DASHBOARD ERROR:', error)
    return NextResponse.json({ error: 'Failed', detail: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
