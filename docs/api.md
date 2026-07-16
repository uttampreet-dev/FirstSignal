# API Reference

## POST /api/chat
Main conversation endpoint — runs the full agent pipeline (`lib/orchestrator.ts`).

**Streaming:** send `Accept: text/event-stream` to watch the pipeline live. The response is a Server-Sent Events stream:

```text
data: {"type":"step","step":{"agent":"Sentiment","decision":"30/100 · negative","ms":412}}
data: {"type":"token","text":"Hi Priya, "}
data: {"type":"reset"}            ← partial text obsolete, a tool phase started
data: {"type":"token","text":"I've initiated your refund"}
data: {"type":"done","result":{ ...full JSON result below... }}
```

Without the header, the endpoint returns plain JSON (used by scripts and integrations).

**Request:**
```json
{
  "message": "string",
  "customerId": "uuid",
  "conversationId": "uuid | null",
  "brandId": "string | null"
}
```

**Response:**
```json
{
  "reply": "string",
  "conversationId": "uuid",
  "sentiment": { "score": 0, "label": "string", "churnRisk": false, "buyingIntent": false },
  "isEscalated": false,
  "memoriesUsed": 0,
  "memoryMode": "semantic | recency",
  "action": { "action": "string", "message": "string", "data": {} },
  "guardrails": [
    { "action": "process_refund", "allowed": true, "rule": "all-checks-passed", "reason": "string" }
  ],
  "injectionFlagged": false,
  "detectedLanguage": "english | hindi | hinglish",
  "trace": {
    "totalMs": 0,
    "steps": [ { "agent": "Sentiment", "decision": "string", "ms": 0 } ]
  }
}
```

`guardrails` lists every action the model proposed with its policy verdict; `trace` is the per-agent decision timeline that also persists to `agent_traces`.

## GET /api/dashboard
All Mission Control data: stats (incl. `avgPipelineMs`), sentiment breakdown/trend, recent conversations, per-customer health trajectories (`score`, `trend`, `series`, `factors`), `guardrails` (stats + event feed + active policy), `agentTraces`, and the `resolutionLedger`.

## POST /api/outreach
Triggers the proactive outreach scan (delayed + overdue orders). Protected by CRON_SECRET.

## POST /api/escalation
Generates an AI escalation briefing for human handoff. Takes `conversationId`.

## GET /api/conversation
Returns full message history for a conversation.

## Demo utilities
- `POST /api/demo/simulate` — seeds a delayed-order scenario for the dashboard demo
- `POST /api/demo/reset` / `POST /api/demo/reset-chat` — restore the demo data to a clean baseline
