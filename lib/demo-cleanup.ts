import { supabaseAdmin } from '@/lib/supabase'

// Demo customer — Meera Patel. All of her proactive conversations come from the
// "Simulate Delayed Order" demo, so cleanup can safely target them.
const DEMO_CUSTOMER_ID = '44444444-4444-4444-4444-444444444444'

// Removes everything a demo run creates: the proactive conversation(s) for the
// demo customer (and their messages), the demo orders, and the proactive-outreach
// memories tied to those orders. Idempotent — safe to call before each simulate
// and on "Reset Demo".
export async function cleanupDemoArtifacts() {
  // 1. Proactive conversations for the demo customer + their messages
  const { data: convs } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('customer_id', DEMO_CUSTOMER_ID)
    .eq('status', 'proactive')

  const convIds = (convs || []).map(c => c.id)
  if (convIds.length) {
    await supabaseAdmin.from('messages').delete().in('conversation_id', convIds)
    await supabaseAdmin.from('conversations').delete().in('id', convIds)
  }

  // 2. Proactive-outreach memories created by the demo
  await supabaseAdmin
    .from('memory_embeddings')
    .delete()
    .eq('customer_id', DEMO_CUSTOMER_ID)
    .eq('metadata->>action', 'proactive_outreach')

  // 3. Demo orders
  await supabaseAdmin.from('orders').delete().like('order_number', 'ORD-DEMO-%')

  return { conversationsRemoved: convIds.length }
}

// Chat demo customer — Priya Sharma (the /chat demo always uses this customer).
const CHAT_CUSTOMER_ID = '11111111-1111-1111-1111-111111111111'
const CHAT_ORDER = 'ORD-2847'

// Resets the chat demo customer to a clean baseline so a fresh recording take
// starts neutral: clears conversations/messages and accumulated memory, resets
// sentiment, and puts her demo order back to a delayed state.
export async function resetChatDemo() {
  const { data: convs } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('customer_id', CHAT_CUSTOMER_ID)

  const convIds = (convs || []).map(c => c.id)
  if (convIds.length) {
    await supabaseAdmin.from('messages').delete().in('conversation_id', convIds)
    await supabaseAdmin.from('conversations').delete().in('id', convIds)
  }

  await supabaseAdmin.from('memory_embeddings').delete().eq('customer_id', CHAT_CUSTOMER_ID)
  await supabaseAdmin.from('customers').update({ sentiment_score: 50 }).eq('id', CHAT_CUSTOMER_ID)

  // Observability tables (exist after the intelligence-upgrade migration; ignore errors if not)
  await supabaseAdmin.from('agent_traces').delete().eq('customer_id', CHAT_CUSTOMER_ID)
  await supabaseAdmin.from('guardrail_events').delete().eq('customer_id', CHAT_CUSTOMER_ID)
  await supabaseAdmin.from('resolution_actions').delete().eq('customer_id', CHAT_CUSTOMER_ID)

  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  await supabaseAdmin
    .from('orders')
    .update({ status: 'delayed', expected_delivery: sixDaysAgo })
    .eq('order_number', CHAT_ORDER)
    .eq('customer_id', CHAT_CUSTOMER_ID)

  return { conversationsRemoved: convIds.length }
}
