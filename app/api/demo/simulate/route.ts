import { supabaseAdmin } from '@/lib/supabase'
import { sendDelayedOrderOutreach } from '@/lib/proactive-outreach'
import { NextResponse } from 'next/server'

// Demo customer — Meera Patel (VIP)
const DEMO_CUSTOMER_ID = '44444444-4444-4444-4444-444444444444'

export async function POST() {
  try {
    const orderNumber = 'ORD-DEMO-' + Date.now()
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

    // 1. Create a delayed order the customer hasn't complained about yet
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: DEMO_CUSTOMER_ID,
        order_number: orderNumber,
        status: 'delayed',
        amount: 3400,
        items: ['Bridal Lehenga', 'Dupatta'],
        expected_delivery: twoDaysAgo,
      })
      .select()
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Failed to create demo order', detail: orderErr?.message }, { status: 500 })
    }

    // 2. Run the real proactive outreach logic — scoped to just this order so the
    //    demo always produces exactly one clean intercept (Aria reaches out before
    //    the customer complains).
    const { data: customer } = await supabaseAdmin
      .from('customers').select('*').eq('id', DEMO_CUSTOMER_ID).single()

    const outreach = await sendDelayedOrderOutreach(order, customer)

    return NextResponse.json({
      success: true,
      order,
      conversation: outreach?.conversation || null,
      message: outreach?.message || null,
      outreachTriggered: !!outreach,
    })
  } catch (error) {
    console.error('DEMO SIMULATE ERROR:', error)
    return NextResponse.json({ error: 'Failed', detail: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
