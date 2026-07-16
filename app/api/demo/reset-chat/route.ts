import { resetChatDemo } from '@/lib/demo-cleanup'
import { NextResponse } from 'next/server'

// Resets the chat demo customer (Priya) to a clean baseline between recording takes.
export async function POST() {
  try {
    const result = await resetChatDemo()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('RESET CHAT DEMO ERROR:', error)
    return NextResponse.json({ error: 'Failed', detail: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
