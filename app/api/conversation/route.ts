import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'No ID' }, { status: 400 })
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('role, content, created_at, sentiment')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
  return NextResponse.json({ messages: messages || [] })
}
