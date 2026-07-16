// One-command verification — designed so a reviewer can clone the repo and
// confirm the build and the security layer with ZERO API keys:
//   npm run verify
// Runs: TypeScript typecheck → injection-screen checks → guardrail policy
// checks (the deterministic, DB-free rules) → production build.

import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { config } from 'dotenv'
config({ path: '.env.local' })

// Placeholders so modules that construct Supabase clients can load without
// real credentials (nothing connects during verification).
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'verify-placeholder'

let failures = 0
const section = (name: string) => console.log(`\n━━━ ${name} ━━━`)
const report = (ok: boolean, what: string) => {
  console.log(`  ${ok ? '✓' : '✗'} ${what}`)
  if (!ok) failures++
}

function run(cmd: string, args: string[], label: string) {
  const res = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', env: process.env })
  const ok = res.status === 0
  report(ok, label)
  if (!ok) console.log((res.stdout + res.stderr).split('\n').slice(-15).join('\n'))
  return ok
}

async function main() {
  console.log('\nFirstSignal verification — no API keys required')

  section('1/4 TypeScript typecheck')
  run('npx', ['tsc', '--noEmit'], 'tsc --noEmit')

  section('2/4 Prompt-injection screen (deterministic)')
  const { scanForInjection, checkAction } = await import('../lib/guardrails')
  const { INJECTION_CASES } = await import('../evals/dataset')
  for (const c of INJECTION_CASES) {
    const got = scanForInjection(c.message).flagged
    report(got === c.shouldFlag, `${c.shouldFlag ? 'flags' : 'passes'}: "${c.message.slice(0, 60)}${c.message.length > 60 ? '…' : ''}"`)
  }

  section('3/4 Guardrail policy rules (deterministic, DB-free)')
  const orders = [{ order_number: 'ORD-2847', amount: 3200 }]
  const ctx = { customerId: 'verify', conversationId: 'verify', orders, actionsThisConversation: 0 }
  const checks: [string, boolean, boolean][] = [
    ['blocks refund on an order the customer does not own',
      !(await checkAction('process_refund', { orderId: 'ORD-9999' }, ctx)).allowed, true],
    ['blocks refund above the ₹10,000 autonomous cap',
      !(await checkAction('process_refund', { orderId: 'BIG-1' }, { ...ctx, orders: [{ order_number: 'BIG-1', amount: 45000 }] })).allowed, true],
    ['blocks out-of-bounds 90% discount',
      !(await checkAction('apply_discount', { discountPercentage: 90 }, ctx)).allowed, true],
    ['blocks a 4th autonomous action in one conversation',
      !(await checkAction('apply_discount', { discountPercentage: 10 }, { ...ctx, actionsThisConversation: 3 })).allowed, true],
    ['always allows escalation to a human',
      (await checkAction('escalate_to_human', {}, ctx)).allowed, true],
  ]
  for (const [label, got, want] of checks) report(got === want, label)

  section('4/4 Production build')
  run('npx', ['next', 'build'], 'next build')

  console.log(existsSync('.env.local')
    ? '\nTip: with keys configured you can also run `npm run check:db` and `npm run eval`.'
    : '\nNote: ran without .env.local — runtime features need keys, but everything above is fully verified.')

  console.log(failures === 0
    ? '\n━━━ VERIFIED — all checks passed ━━━\n'
    : `\n━━━ ${failures} check(s) FAILED ━━━\n`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
