import { cleanupDemoArtifacts } from '@/lib/demo-cleanup'
import { NextResponse } from 'next/server'

// Removes the demo conversation/order/memory created by "Simulate Delayed Order",
// returning the dashboard to its pre-demo state.
export async function POST() {
  try {
    const result = await cleanupDemoArtifacts()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('DEMO RESET ERROR:', error)
    return NextResponse.json({ error: 'Failed', detail: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
