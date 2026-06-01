import { supabaseAdmin } from '@/lib/supabase'

export type ResolutionAction =
  | 'process_refund'
  | 'apply_discount'
  | 'escalate_to_human'
  | 'schedule_callback'
  | 'mark_redelivery'

export interface ResolutionResult {
  success: boolean
  action: ResolutionAction
  message: string
  data?: Record<string, any>
}

export async function processRefund(
  customerId: string,
  orderId: string,
  reason: string
): Promise<ResolutionResult> {
  const refundId = `REF-${Date.now()}`

  await supabaseAdmin.from('orders')
    .update({ status: 'refund_initiated' })
    .eq('order_number', orderId)

  await supabaseAdmin.from('memory_embeddings').insert({
    customer_id: customerId,
    content: `Refund processed for order ${orderId}. Reason: ${reason}. Refund ID: ${refundId}`,
    metadata: { action: 'refund', orderId, refundId, timestamp: new Date().toISOString() }
  })

  return {
    success: true,
    action: 'process_refund',
    message: `Refund initiated successfully. Refund ID: ${refundId}. Amount will be credited within 5-7 business days.`,
    data: { refundId, orderId }
  }
}

export async function applyDiscount(
  customerId: string,
  percentage: number
): Promise<ResolutionResult> {
  const code = `SORRY${percentage}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

  await supabaseAdmin.from('memory_embeddings').insert({
    customer_id: customerId,
    content: `Discount code ${code} (${percentage}% off) applied as compensation`,
    metadata: { action: 'discount', code, percentage, timestamp: new Date().toISOString() }
  })

  return {
    success: true,
    action: 'apply_discount',
    message: `Discount code applied: ${code} — ${percentage}% off your next order. Valid for 30 days.`,
    data: { code, percentage }
  }
}

export async function markRedelivery(
  customerId: string,
  orderId: string
): Promise<ResolutionResult> {
  await supabaseAdmin.from('orders')
    .update({ status: 'redelivery_scheduled' })
    .eq('order_number', orderId)

  await supabaseAdmin.from('memory_embeddings').insert({
    customer_id: customerId,
    content: `Express redelivery scheduled for order ${orderId}`,
    metadata: { action: 'redelivery', orderId, timestamp: new Date().toISOString() }
  })

  return {
    success: true,
    action: 'mark_redelivery',
    message: `Express redelivery scheduled for order ${orderId}. Expected within 24-48 hours.`,
    data: { orderId }
  }
}

export async function escalateToHuman(
  customerId: string,
  conversationId: string,
  reason: string,
  sentiment: any
): Promise<ResolutionResult> {
  await supabaseAdmin.from('conversations').update({
    is_escalated: true,
    resolution: `Escalated: ${reason}`
  }).eq('id', conversationId)

  await supabaseAdmin.from('memory_embeddings').insert({
    customer_id: customerId,
    content: `Escalated to human agent. Reason: ${reason}. Sentiment score: ${sentiment.score}/100`,
    metadata: { action: 'escalation', reason, sentiment, timestamp: new Date().toISOString() }
  })

  return {
    success: true,
    action: 'escalate_to_human',
    message: `Escalated to senior support team. A human agent will contact you within 30 minutes.`,
    data: { reason }
  }
}
