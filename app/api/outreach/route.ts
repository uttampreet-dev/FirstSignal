import { checkAndTriggerOutreach } from '@/lib/proactive-outreach'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const results = await checkAndTriggerOutreach()
    return NextResponse.json({ success: true, outreachSent: results.length, results })
  } catch (error) {
    console.error('OUTREACH ERROR:', error)
    return NextResponse.json({ error: 'Failed', detail: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
