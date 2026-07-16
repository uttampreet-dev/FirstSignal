// Customer health trajectory — churn early-warning scoring.
// Not a single-message snapshot: an exponentially-weighted moving average over
// the customer's full sentiment history, adjusted by order problems, escalations
// and loyalty, with a trend direction from the recent trajectory slope.
//
//   health = clamp( EWMA(sentiment history, α=0.3)
//                   + loyalty bonus            (up to +12)
//                   + spend bonus              (up to +8)
//                   − escalation penalty       (10 each, cap 30)
//                   − order-trouble penalty    (6 per delayed/refunded order, cap 18) )

export interface HealthFactors {
  sentimentEwma: number
  loyaltyBonus: number
  spendBonus: number
  escalationPenalty: number
  orderTroublePenalty: number
}

export interface HealthResult {
  score: number
  trend: 'improving' | 'stable' | 'declining'
  /** Recent sentiment series used for the trajectory (oldest → newest) */
  series: number[]
  factors: HealthFactors
}

function ewma(series: number[], alpha = 0.3): number {
  if (series.length === 0) return 50
  let value = series[0]
  for (let i = 1; i < series.length; i++) value = alpha * series[i] + (1 - alpha) * value
  return value
}

export function computeHealth(input: {
  customer: any
  /** This customer's conversations */
  conversations: any[]
  /** This customer's user-message sentiment scores, oldest → newest (may be empty) */
  sentimentSeries: number[]
  /** This customer's orders */
  orders: any[]
}): HealthResult {
  const { customer, conversations, orders } = input

  // Prefer per-message scores; fall back to per-conversation scores
  let series = input.sentimentSeries.filter(s => typeof s === 'number')
  if (series.length === 0) {
    series = conversations
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(c => c.sentiment_score)
      .filter((s: any) => typeof s === 'number')
  }

  const sentimentEwma = ewma(series)

  // Trend: recent window vs the one before it
  let trend: HealthResult['trend'] = 'stable'
  if (series.length >= 4) {
    const half = Math.floor(series.length / 2)
    const older = series.slice(0, half)
    const recent = series.slice(half)
    const delta = ewma(recent) - ewma(older)
    trend = delta > 5 ? 'improving' : delta < -5 ? 'declining' : 'stable'
  }

  const escalations = conversations.filter(c => c.is_escalated).length
  const troubledOrders = orders.filter(o =>
    ['delayed', 'refund_initiated', 'redelivery_scheduled'].includes(String(o.status).toLowerCase())
  ).length

  const factors: HealthFactors = {
    sentimentEwma: Math.round(sentimentEwma),
    loyaltyBonus: Math.min((customer.total_orders || 0) * 1.5, 12),
    spendBonus: customer.total_spent > 15000 ? 8 : customer.total_spent > 8000 ? 5 : customer.total_spent > 3000 ? 2 : 0,
    escalationPenalty: Math.min(escalations * 10, 30),
    orderTroublePenalty: Math.min(troubledOrders * 6, 18),
  }

  const score = Math.max(0, Math.min(100, Math.round(
    sentimentEwma + factors.loyaltyBonus + factors.spendBonus - factors.escalationPenalty - factors.orderTroublePenalty
  )))

  return { score, trend, series: series.slice(-10), factors }
}
