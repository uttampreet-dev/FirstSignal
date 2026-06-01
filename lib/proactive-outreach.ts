import { supabaseAdmin } from '@/lib/supabase'

export async function checkAndTriggerOutreach() {
  const results: any[] = []

  // Trigger 1: Delayed orders — customer hasn't complained yet
  const { data: delayedOrders } = await supabaseAdmin
    .from('orders')
    .select('*, customers(*)')
    .eq('status', 'delayed')
    .lt('expected_delivery', new Date().toISOString())

  for (const order of delayedOrders || []) {
    const customer = order.customers

    // Check if we already sent outreach for this order
    const { data: existing } = await supabaseAdmin
      .from('memory_embeddings')
      .select('id')
      .eq('customer_id', customer.id)
      .contains('metadata', { action: 'proactive_outreach', orderId: order.order_number })
      .limit(1)

    if (existing && existing.length > 0) continue

    // Create a proactive conversation
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .insert({
        customer_id: customer.id,
        status: 'proactive',
        sentiment: 'neutral',
        sentiment_score: 50
      })
      .select()
      .single()

    const proactiveMessage = `Hi ${customer.name}! I noticed your order ${order.order_number} (${JSON.stringify(order.items)}) was expected on ${new Date(order.expected_delivery).toLocaleDateString('en-IN')} but hasn't arrived yet. I'm so sorry about this delay${customer.is_vip ? ' — as one of our VIP customers, this is unacceptable and I want to make it right immediately' : ''}. Would you like me to arrange express redelivery or process a refund?`

    await supabaseAdmin.from('messages').insert({
      conversation_id: conv?.id,
      role: 'assistant',
      content: proactiveMessage
    })

    // Save outreach record to memory
    await supabaseAdmin.from('memory_embeddings').insert({
      customer_id: customer.id,
      content: `Proactive outreach sent for delayed order ${order.order_number}`,
      metadata: {
        action: 'proactive_outreach',
        orderId: order.order_number,
        type: 'delayed_order',
        timestamp: new Date().toISOString()
      }
    })

    results.push({
      type: 'delayed_order',
      customerId: customer.id,
      customerName: customer.name,
      orderId: order.order_number,
      message: proactiveMessage
    })
  }

  // Trigger 2: Orders not received 5+ days after expected delivery
  const fiveDaysAgo = new Date()
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

  const { data: overdueOrders } = await supabaseAdmin
    .from('orders')
    .select('*, customers(*)')
    .eq('status', 'processing')
    .lt('expected_delivery', fiveDaysAgo.toISOString())

  for (const order of overdueOrders || []) {
    const customer = order.customers

    const { data: existing } = await supabaseAdmin
      .from('memory_embeddings')
      .select('id')
      .eq('customer_id', customer.id)
      .contains('metadata', { action: 'proactive_outreach', orderId: order.order_number })
      .limit(1)

    if (existing && existing.length > 0) continue

    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .insert({ customer_id: customer.id, status: 'proactive' })
      .select()
      .single()

    const proactiveMessage = `Hi ${customer.name}, I wanted to reach out because your order ${order.order_number} seems to be taking longer than expected. I'm investigating this right now and I'll make sure you're taken care of. Can I arrange a priority resolution for you?`

    await supabaseAdmin.from('messages').insert({
      conversation_id: conv?.id,
      role: 'assistant',
      content: proactiveMessage
    })

    await supabaseAdmin.from('memory_embeddings').insert({
      customer_id: customer.id,
      content: `Proactive outreach sent for overdue order ${order.order_number}`,
      metadata: {
        action: 'proactive_outreach',
        orderId: order.order_number,
        type: 'overdue_order',
        timestamp: new Date().toISOString()
      }
    })

    results.push({
      type: 'overdue_order',
      customerId: customer.id,
      customerName: customer.name,
      orderId: order.order_number
    })
  }

  return results
}
