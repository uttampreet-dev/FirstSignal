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
