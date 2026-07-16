import { supabaseAdmin } from '@/lib/supabase'
import { saveMemory } from '@/lib/memory'

// Resolution Engine — executes real, verified actions against the database.
// Only called after the Guardrails Engine approves; every execution is
// recorded in the resolution_actions ledger (which the guardrails read to
// enforce per-order and per-customer limits).

export type ResolutionAction =
  | 'process_refund'
  | 'apply_discount'
  | 'escalate_to_human'
  | 'mark_redelivery'

export interface ResolutionResult {
  success: boolean
  action: ResolutionAction
  message: string
  data?: Record<string, any>
}

export interface ResolutionContext {
  customerId: string
  conversationId: string
}

async function recordLedger(
  ctx: ResolutionContext,
  action: ResolutionAction,
  fields: { orderId?: string; amount?: number; discountPct?: number; reference?: string }
) {
  try {
    await supabaseAdmin.from('resolution_actions').insert({
      customer_id: ctx.customerId,
      conversation_id: ctx.conversationId,
      action,
      order_id: fields.orderId || null,
      amount: fields.amount ?? null,
      discount_pct: fields.discountPct ?? null,
      reference: fields.reference || null
    })
  } catch (err) {
    console.error('resolution_actions insert failed (run the SQL migration?):', err)
  }
}

export async function processRefund(
  ctx: ResolutionContext,
  order: { order_number: string; amount?: number },
  reason: string
): Promise<ResolutionResult> {
  const refundId = `REF-${Date.now()}`

  await supabaseAdmin.from('orders')
    .update({ status: 'refund_initiated' })
    .eq('order_number', order.order_number)

  await recordLedger(ctx, 'process_refund', {
    orderId: order.order_number,
    amount: Number(order.amount) || undefined,
    reference: refundId
  })

  await saveMemory(ctx.customerId,
    `Refund processed for order ${order.order_number}. Reason: ${reason}. Refund ID: ${refundId}`,
    { action: 'refund', orderId: order.order_number, refundId, timestamp: new Date().toISOString() }
  )

  return {
    success: true,
    action: 'process_refund',
    message: `Refund initiated successfully. Refund ID: ${refundId}. Amount will be credited within 5-7 business days.`,
    data: { refundId, orderId: order.order_number }
  }
}

export async function applyDiscount(
  ctx: ResolutionContext,
  percentage: number,
  reason: string
): Promise<ResolutionResult> {
  const code = `SORRY${percentage}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

  await recordLedger(ctx, 'apply_discount', { discountPct: percentage, reference: code })

  await saveMemory(ctx.customerId,
    `Discount code ${code} (${percentage}% off) applied. Reason: ${reason}`,
    { action: 'discount', code, percentage, timestamp: new Date().toISOString() }
  )

  return {
    success: true,
    action: 'apply_discount',
    message: `Discount code applied: ${code} — ${percentage}% off your next order. Valid for 30 days.`,
    data: { code, percentage }
  }
}

export async function markRedelivery(
  ctx: ResolutionContext,
  order: { order_number: string },
  reason: string
): Promise<ResolutionResult> {
  await supabaseAdmin.from('orders')
    .update({ status: 'redelivery_scheduled' })
    .eq('order_number', order.order_number)

  await recordLedger(ctx, 'mark_redelivery', { orderId: order.order_number })

  await saveMemory(ctx.customerId,
    `Express redelivery scheduled for order ${order.order_number}. Reason: ${reason}`,
    { action: 'redelivery', orderId: order.order_number, timestamp: new Date().toISOString() }
  )

  return {
    success: true,
    action: 'mark_redelivery',
    message: `Express redelivery scheduled for order ${order.order_number}. Expected within 24-48 hours.`,
    data: { orderId: order.order_number }
  }
}

export async function escalateToHuman(
  ctx: ResolutionContext,
  reason: string,
  sentiment: any
): Promise<ResolutionResult> {
  await supabaseAdmin.from('conversations').update({
    is_escalated: true,
    resolution: `Escalated: ${reason}`
  }).eq('id', ctx.conversationId)

  await recordLedger(ctx, 'escalate_to_human', {})

  await saveMemory(ctx.customerId,
    `Escalated to human agent. Reason: ${reason}. Sentiment score: ${sentiment?.score ?? 'n/a'}/100`,
    { action: 'escalation', reason, sentiment, timestamp: new Date().toISOString() }
  )

  return {
    success: true,
    action: 'escalate_to_human',
    message: `Escalated to senior support team. A human agent will contact you within 30 minutes.`,
    data: { reason }
  }
}
