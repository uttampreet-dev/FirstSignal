// Tool definitions for Groq function calling.
// The LLM decides *which* action to take with *which* arguments; the guardrails
// engine decides whether it's allowed; the resolution engine executes it.
// Valid order IDs are injected into the schema as an enum, so the model can
// never hallucinate an order number that doesn't belong to the customer.

// Shared system-prompt guidance for tool use — used verbatim by the production
// orchestrator AND the eval harness so measured numbers reflect production behavior.
export const TOOL_GUIDANCE = `TOOLS: You can execute real actions (refund, discount, redelivery, human escalation) via tools. Every call is checked against company policy and logged.
- If the customer asks for their money back in any language (e.g. "refund", "money back", "paisa wapas"), call process_refund for the relevant order.
- If the customer asks you to make it up to them, compensate them, or offer something for a bad experience (and a refund isn't warranted), call apply_discount.
- If they want the item sent again, call mark_redelivery.
- If they demand a human/manager or you cannot resolve the issue, call escalate_to_human.
- Never promise an action in words without calling its tool, and never call a tool the conversation doesn't warrant.`

export function buildTools(orders: any[]) {
  const orderIds = orders.map(o => o.order_number)
  const orderIdSchema = orderIds.length > 0
    ? { type: 'string', enum: orderIds, description: 'The customer\'s order to act on' }
    : { type: 'string', description: 'The customer\'s order to act on' }

  return [
    {
      type: 'function' as const,
      function: {
        name: 'process_refund',
        description:
          'Initiate a full refund for one of the customer\'s orders. Use ONLY when the customer clearly wants their money back for a legitimate issue (damaged, wrong item, unacceptable delay) and conversation context supports it.',
        parameters: {
          type: 'object',
          properties: {
            orderId: orderIdSchema,
            reason: { type: 'string', description: 'Short justification, e.g. "Order 6 days late, customer requested refund"' }
          },
          required: ['orderId', 'reason']
        }
      }
    },
    {
      type: 'function' as const,
      function: {
        name: 'apply_discount',
        description:
          'Grant a goodwill discount code (5–15%) on the customer\'s next order as compensation for a poor experience. Use when the customer asks you to make it up to them or deserves a make-good and a refund is not warranted.',
        parameters: {
          type: 'object',
          properties: {
            discountPercentage: { type: 'integer', minimum: 5, maximum: 15, description: '5–10 for minor issues, 15 for serious ones or VIP customers' },
            reason: { type: 'string' }
          },
          required: ['discountPercentage', 'reason']
        }
      }
    },
    {
      type: 'function' as const,
      function: {
        name: 'mark_redelivery',
        description:
          'Schedule a free express redelivery for a delayed, lost, or wrongly-delivered order.',
        parameters: {
          type: 'object',
          properties: {
            orderId: orderIdSchema,
            reason: { type: 'string' }
          },
          required: ['orderId', 'reason']
        }
      }
    },
    {
      type: 'function' as const,
      function: {
        name: 'escalate_to_human',
        description:
          'Hand the conversation to a senior human agent. Use when the customer is extremely frustrated, threatens to leave, has a complex issue you cannot resolve, or explicitly asks for a human.',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string', description: 'Briefing note for the human agent' }
          },
          required: ['reason']
        }
      }
    }
  ]
}

export type ToolName = 'process_refund' | 'apply_discount' | 'mark_redelivery' | 'escalate_to_human'

export interface ProposedAction {
  name: ToolName
  args: { orderId?: string; discountPercentage?: number; reason?: string }
}

export function parseToolCalls(toolCalls: any[]): ProposedAction[] {
  const actions: ProposedAction[] = []
  for (const tc of toolCalls || []) {
    try {
      actions.push({
        name: tc.function.name as ToolName,
        args: JSON.parse(tc.function.arguments || '{}')
      })
    } catch {
      // malformed arguments — skip rather than crash
    }
  }
  return actions
}
