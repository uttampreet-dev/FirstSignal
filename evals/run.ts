// FirstSignal eval harness — measures the AI components against labeled data.
//   npm run eval
// Runs against the real production prompts and the real Groq model, plus
// deterministic guardrail unit checks. Writes evals/results.json.

import { config } from 'dotenv'
config({ path: '.env.local' })

import { writeFileSync } from 'fs'
import { join } from 'path'
import { SENTIMENT_CASES, ACTION_CASES, INJECTION_CASES, type SentimentBucket } from './dataset'

function bucketOf(score: number): SentimentBucket {
  return score <= 25 ? 'critical' : score <= 45 ? 'negative' : score <= 60 ? 'neutral' : 'positive'
}

async function withRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  for (let i = 0; ; i++) {
    try { return await fn() } catch (err: any) {
      if (i >= tries - 1 || err?.status !== 429) throw err
      const wait = 3000 * (i + 1)
      console.log(`  rate limited — waiting ${wait / 1000}s`)
      await new Promise(r => setTimeout(r, wait))
    }
  }
}

async function runBatched<I, O>(items: I[], size: number, fn: (item: I) => Promise<O>): Promise<O[]> {
  const out: O[] = []
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size)
    out.push(...await Promise.all(batch.map(fn)))
    process.stdout.write(`  ${Math.min(i + size, items.length)}/${items.length}\r`)
  }
  return out
}

async function main() {
  const { analyzeSentiment } = await import('../lib/sentiment')
  const { buildTools, parseToolCalls } = await import('../lib/tools')
  const { scanForInjection, checkAction } = await import('../lib/guardrails')
  const { buildSystemPrompt } = await import('../lib/system-prompt')
  const Groq = (await import('groq-sdk')).default
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

  console.log('\n━━━ FirstSignal Eval Suite ━━━\n')

  // ── 1. Sentiment Agent ────────────────────────────────────────────────────
  console.log(`[1/3] Sentiment Agent — ${SENTIMENT_CASES.length} labeled messages`)
  const sentimentResults = await runBatched(SENTIMENT_CASES, 3, async (c) => {
    const r = await withRetry(() => analyzeSentiment(c.message))
    return {
      message: c.message,
      expectedBucket: c.expectedBucket,
      gotBucket: bucketOf(r.score),
      score: r.score,
      expectedChurn: c.expectedChurnRisk,
      gotChurn: r.churnRisk,
      bucketMatch: bucketOf(r.score) === c.expectedBucket,
      churnMatch: r.churnRisk === c.expectedChurnRisk,
      adjacentMatch: Math.abs(
        ['critical', 'negative', 'neutral', 'positive'].indexOf(bucketOf(r.score)) -
        ['critical', 'negative', 'neutral', 'positive'].indexOf(c.expectedBucket)
      ) <= 1
    }
  })
  const bucketAcc = sentimentResults.filter(r => r.bucketMatch).length / sentimentResults.length
  const adjacentAcc = sentimentResults.filter(r => r.adjacentMatch).length / sentimentResults.length
  const churnAcc = sentimentResults.filter(r => r.churnMatch).length / sentimentResults.length
  console.log(`  bucket accuracy:          ${(bucketAcc * 100).toFixed(1)}%`)
  console.log(`  within-one-bucket:        ${(adjacentAcc * 100).toFixed(1)}%`)
  console.log(`  churn-risk accuracy:      ${(churnAcc * 100).toFixed(1)}%\n`)

  // ── 2. Action decisions (tool calling, production prompt) ────────────────
  console.log(`[2/3] Action decisions — ${ACTION_CASES.length} cases via Groq tool calling`)
  const fixtureCustomer = {
    name: 'Priya Sharma', email: 'priya@example.com', is_vip: true,
    total_orders: 8, total_spent: 12400, sentiment_score: 40
  }
  const fixtureOrders = [
    // EVAL-2847, not the live demo's ORD-2847 — the ledger-backed policy checks
    // must not collide with compensations created by demo runs.
    { order_number: 'EVAL-2847', status: 'Delayed', amount: 3200, items: 'Blue Kurta Set', expected_delivery: new Date().toISOString(), customer_id: 'x' },
  ]
  const { TOOL_GUIDANCE } = await import('../lib/tools')
  const tools = buildTools(fixtureOrders)
  let systemPrompt = buildSystemPrompt(fixtureCustomer, fixtureOrders, [], null)
  systemPrompt += `\n\n${TOOL_GUIDANCE}`

  const actionResults = await runBatched(ACTION_CASES, 3, async (c) => {
    const completion = await withRetry(() => groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: c.message }
      ],
      tools, tool_choice: 'auto', max_tokens: 400, temperature: 0
    }))
    const calls = parseToolCalls(completion.choices[0].message.tool_calls || [])
    const got = calls[0]?.name || 'none'
    return {
      message: c.message, expected: c.expected, got,
      correct: got === c.expected || (c.alsoAcceptable ? got === c.alsoAcceptable : false)
    }
  })
  const actionAcc = actionResults.filter(r => r.correct).length / actionResults.length
  // Per-tool precision/recall
  const toolNames = ['process_refund', 'apply_discount', 'mark_redelivery', 'escalate_to_human', 'none']
  const perTool = toolNames.map(tool => {
    const tp = actionResults.filter(r => r.got === tool && (r.expected === tool || (r as any).alsoAcceptable === tool || r.correct && r.got === tool)).length
    const predicted = actionResults.filter(r => r.got === tool).length
    const actual = actionResults.filter(r => r.expected === tool).length
    return {
      tool,
      precision: predicted > 0 ? tp / predicted : null,
      recall: actual > 0 ? actionResults.filter(r => r.expected === tool && r.correct).length / actual : null
    }
  })
  console.log(`  decision accuracy:        ${(actionAcc * 100).toFixed(1)}%`)
  for (const t of perTool) {
    if (t.precision !== null || t.recall !== null) {
      console.log(`    ${t.tool.padEnd(20)} P=${t.precision === null ? ' n/a' : (t.precision * 100).toFixed(0) + '%'} R=${t.recall === null ? 'n/a' : (t.recall * 100).toFixed(0) + '%'}`)
    }
  }
  console.log()

  // ── 3. Guardrails (deterministic) ─────────────────────────────────────────
  console.log(`[3/3] Guardrails — ${INJECTION_CASES.length} injection cases + policy checks`)
  const injectionResults = INJECTION_CASES.map(c => ({
    ...c, got: scanForInjection(c.message).flagged,
    correct: scanForInjection(c.message).flagged === c.shouldFlag
  }))
  const injAcc = injectionResults.filter(r => r.correct).length / injectionResults.length

  const gctx = { customerId: 'test', conversationId: 'test', orders: fixtureOrders, actionsThisConversation: 0 }
  const policyChecks = [
    { name: 'blocks refund on non-owned order', verdict: await checkAction('process_refund', { orderId: 'ORD-9999' }, gctx), expectAllowed: false },
    { name: 'allows refund on owned order', verdict: await checkAction('process_refund', { orderId: 'EVAL-2847' }, gctx), expectAllowed: true },
    { name: 'blocks refund above ₹10,000 cap', verdict: await checkAction('process_refund', { orderId: 'BIG-1' }, { ...gctx, orders: [{ order_number: 'BIG-1', amount: 45000 }] }), expectAllowed: false },
    { name: 'blocks 90% discount (out of bounds)', verdict: await checkAction('apply_discount', { discountPercentage: 90 }, gctx), expectAllowed: false },
    { name: 'blocks 4th action in one conversation', verdict: await checkAction('apply_discount', { discountPercentage: 10 }, { ...gctx, actionsThisConversation: 3 }), expectAllowed: false },
    { name: 'always allows human escalation', verdict: await checkAction('escalate_to_human', {}, { ...gctx, actionsThisConversation: 0 }), expectAllowed: true },
  ]
  const policyResults = policyChecks.map(c => ({ name: c.name, pass: c.verdict.allowed === c.expectAllowed, rule: c.verdict.rule }))
  const policyPass = policyResults.filter(r => r.pass).length

  console.log(`  injection detection:      ${(injAcc * 100).toFixed(1)}% (${injectionResults.filter(r => r.correct).length}/${injectionResults.length})`)
  console.log(`  policy checks:            ${policyPass}/${policyChecks.length} passed`)
  for (const r of policyResults) console.log(`    ${r.pass ? '✓' : '✗'} ${r.name} [${r.rule}]`)

  const summary = {
    ranAt: new Date().toISOString(),
    model: 'llama-3.3-70b-versatile',
    sentiment: {
      cases: SENTIMENT_CASES.length,
      bucketAccuracy: +(bucketAcc * 100).toFixed(1),
      withinOneBucket: +(adjacentAcc * 100).toFixed(1),
      churnRiskAccuracy: +(churnAcc * 100).toFixed(1)
    },
    actions: {
      cases: ACTION_CASES.length,
      decisionAccuracy: +(actionAcc * 100).toFixed(1),
      perTool
    },
    guardrails: {
      injectionCases: INJECTION_CASES.length,
      injectionAccuracy: +(injAcc * 100).toFixed(1),
      policyChecksPassed: `${policyPass}/${policyChecks.length}`
    },
    details: { sentimentResults, actionResults, injectionResults, policyResults }
  }
  writeFileSync(join(__dirname, 'results.json'), JSON.stringify(summary, null, 2))
  console.log('\nResults written to evals/results.json\n')

  const failures = sentimentResults.filter(r => !r.bucketMatch).length +
    actionResults.filter(r => !r.correct).length +
    injectionResults.filter(r => !r.correct).length +
    (policyChecks.length - policyPass)
  console.log(`━━━ Done — ${failures} total misses across ${SENTIMENT_CASES.length + ACTION_CASES.length + INJECTION_CASES.length + policyChecks.length} checks ━━━\n`)
}

main().catch(err => { console.error(err); process.exit(1) })
