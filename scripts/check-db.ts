// Verifies the Supabase schema is ready for the intelligence upgrade.
//   npm run check:db
// Tells you exactly what's missing and how to fix it.

import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let ok = true
  const fail = (what: string, hint: string) => {
    ok = false
    console.log(`  ✗ ${what}\n    → ${hint}`)
  }
  const pass = (what: string) => console.log(`  ✓ ${what}`)

  console.log('\nChecking FirstSignal database schema…\n')

  for (const table of ['agent_traces', 'guardrail_events', 'resolution_actions']) {
    const { error } = await supabase.from(table).select('id').limit(1)
    if (error) fail(`table ${table}`, 'Run supabase/migrations/20260716_intelligence_upgrade.sql in the Supabase SQL editor')
    else pass(`table ${table}`)
  }

  const { error: msgErr } = await supabase.from('messages').select('sentiment_score').limit(1)
  if (msgErr) fail('messages.sentiment_score column', 'Run the migration SQL')
  else pass('messages.sentiment_score column')

  const { error: rpcErr } = await supabase.rpc('match_memories', {
    p_customer_id: '00000000-0000-0000-0000-000000000000',
    query_embedding: Array(384).fill(0),
    match_count: 1,
    min_similarity: 0.99
  })
  if (rpcErr) fail('match_memories RPC (pgvector)', `Run the migration SQL — error: ${rpcErr.message}`)
  else pass('match_memories RPC (pgvector semantic search)')

  console.log(ok
    ? '\nAll good — the full intelligence pipeline is active.\n'
    : '\nSchema incomplete. Paste supabase/migrations/20260716_intelligence_upgrade.sql into the Supabase SQL editor and run it, then re-run npm run check:db.\nUntil then the app still works, but falls back to recency memory and skips trace/guardrail persistence.\n')
  process.exit(ok ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
