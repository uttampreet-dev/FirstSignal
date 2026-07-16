import { supabaseAdmin } from '@/lib/supabase'

// Guardrails Engine — the policy layer between the LLM and real-world actions.
// The model can *propose* refunds, discounts, and redeliveries; nothing executes
// until it passes these deterministic checks. Every verdict (allowed or blocked)
// is logged to guardrail_events and surfaced on the dashboard.

export interface GuardrailContext {
  customerId: string
  conversationId: string
  orders: any[]
  /** Autonomous actions already executed in this conversation */
  actionsThisConversation: number
}

export interface GuardrailVerdict {
  allowed: boolean
  rule: string
  reason: string
}

export const POLICY = {
  /** Max order value (₹) the AI may refund without human approval */
  maxAutonomousRefund: 10000,
  /** Discount percentage the AI may grant */
  discountRange: { min: 5, max: 15 },
  /** Max compensating actions (refund/discount/redelivery) per order */
  maxCompensationsPerOrder: 1,
  /** Max autonomous actions in a single conversation */
  maxActionsPerConversation: 3,
  /** Days a customer must wait between goodwill discounts */
  discountCooldownDays: 30,
} as const

// --- Prompt-injection screening (deterministic, runs before the LLM) ---------

const INJECTION_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /ignore\s+(all\s+|your\s+)?(previous|prior|above|earlier)\s+(instructions|prompts|rules)/i, label: 'instruction-override' },
  { pattern: /disregard\s+(your|the|all)\s+(instructions|rules|guidelines|policy|policies)/i, label: 'instruction-override' },
  { pattern: /(system\s+prompt|developer\s+message|hidden\s+instructions)/i, label: 'prompt-extraction' },
  { pattern: /you\s+are\s+now\s+(a|an|in)\s/i, label: 'role-hijack' },
  { pattern: /(jailbreak|dan\s+mode|developer\s+mode|no\s+restrictions)/i, label: 'role-hijack' },
  { pattern: /pretend\s+(to\s+be|you\s+are)\s+(?!a\s+customer)/i, label: 'role-hijack' },
  { pattern: /refund\s+(me\s+)?(₹|rs\.?\s?)?\d{5,}/i, label: 'excessive-amount' },
  { pattern: /(give|send)\s+me\s+(a\s+)?(full\s+)?refund\s+for\s+(all|every)/i, label: 'bulk-refund' },
  { pattern: /repeat\s+(everything|all|the)\s+(above|instructions|prompt)/i, label: 'prompt-extraction' },
]

export interface InjectionScan {
  flagged: boolean
  label: string | null
}

export function scanForInjection(message: string): InjectionScan {
  for (const { pattern, label } of INJECTION_PATTERNS) {
    if (pattern.test(message)) return { flagged: true, label }
  }
  return { flagged: false, label: null }
}

// --- Action-level policy checks ----------------------------------------------

async function compensationsForOrder(orderId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('resolution_actions')
    .select('id')
    .eq('order_id', orderId)
    .in('action', ['process_refund', 'apply_discount', 'mark_redelivery'])
  if (error) return 0 // table missing → don't hard-fail the conversation
  return data?.length || 0
}

async function recentDiscounts(customerId: string): Promise<number> {
  const since = new Date()
  since.setDate(since.getDate() - POLICY.discountCooldownDays)
  const { data, error } = await supabaseAdmin
    .from('resolution_actions')
    .select('id')
    .eq('customer_id', customerId)
    .eq('action', 'apply_discount')
    .gte('created_at', since.toISOString())
  if (error) return 0
  return data?.length || 0
}

export async function checkAction(
  action: string,
  args: { orderId?: string; discountPercentage?: number },
  ctx: GuardrailContext
): Promise<GuardrailVerdict> {
  // Rule 0: conversation-level rate limit
  if (ctx.actionsThisConversation >= POLICY.maxActionsPerConversation) {
    return {
      allowed: false,
      rule: 'rate-limit',
      reason: `Max ${POLICY.maxActionsPerConversation} autonomous actions per conversation reached — escalating to human instead.`
    }
  }

  // Escalation to a human is always allowed
  if (action === 'escalate_to_human') {
    return { allowed: true, rule: 'escalation-always-allowed', reason: 'Escalations to humans are never blocked.' }
  }

  // Rule 1: order ownership — the order must belong to THIS customer
  if (action === 'process_refund' || action === 'mark_redelivery') {
    const order = ctx.orders.find(o => o.order_number === args.orderId)
    if (!order) {
      return {
        allowed: false,
        rule: 'order-ownership',
        reason: `Order ${args.orderId || '(none)'} does not belong to this customer — refusing to act on it.`
      }
    }

    // Rule 2: refund value cap
    if (action === 'process_refund' && Number(order.amount) > POLICY.maxAutonomousRefund) {
      return {
        allowed: false,
        rule: 'refund-cap',
        reason: `Order value ₹${order.amount} exceeds the ₹${POLICY.maxAutonomousRefund} autonomous refund limit — requires human approval.`
      }
    }

    // Rule 3: one compensation per order
    const priorComps = await compensationsForOrder(args.orderId!)
    if (priorComps >= POLICY.maxCompensationsPerOrder) {
      return {
        allowed: false,
        rule: 'duplicate-compensation',
        reason: `Order ${args.orderId} was already compensated — a second autonomous compensation is not allowed.`
      }
    }
  }

  if (action === 'apply_discount') {
    // Rule 4: discount bounds
    const pct = args.discountPercentage ?? 10
    if (pct < POLICY.discountRange.min || pct > POLICY.discountRange.max) {
      return {
        allowed: false,
        rule: 'discount-bounds',
        reason: `Discount ${pct}% is outside the allowed ${POLICY.discountRange.min}–${POLICY.discountRange.max}% range.`
      }
    }
    // Rule 5: discount cooldown
    const recent = await recentDiscounts(ctx.customerId)
    if (recent > 0) {
      return {
        allowed: false,
        rule: 'discount-cooldown',
        reason: `Customer already received a goodwill discount in the last ${POLICY.discountCooldownDays} days.`
      }
    }
  }

  return { allowed: true, rule: 'all-checks-passed', reason: 'Action is within policy.' }
}

// --- Event logging -------------------------------------------------------------

export async function logGuardrailEvent(
  ctx: { customerId: string; conversationId: string },
  action: string,
  verdict: GuardrailVerdict,
  payload?: Record<string, any>
) {
  try {
    await supabaseAdmin.from('guardrail_events').insert({
      customer_id: ctx.customerId,
      conversation_id: ctx.conversationId,
      action,
      verdict: verdict.allowed ? 'allowed' : 'blocked',
      rule: verdict.rule,
      reason: verdict.reason,
      payload: payload || {}
    })
  } catch (err) {
    console.error('guardrail_events insert failed (run the SQL migration?):', err)
  }
}
