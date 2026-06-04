# API Reference

## POST /api/chat
Main conversation endpoint. Orchestrates all 6 agents.

**Request:**
```json
{
  "message": "string",
  "customerId": "uuid",
  "conversationId": "uuid | null"
}
```

**Response:**
```json
{
  "reply": "string",
  "conversationId": "uuid",
  "sentiment": { "score": 0-100, "label": "string", "churnRisk": boolean },
  "isEscalated": boolean,
  "memoriesUsed": number,
  "action": { "action": "string", "message": "string" }
}
```

## GET /api/dashboard
Returns all analytics data for the Mission Control dashboard.

## POST /api/outreach
Triggers proactive outreach scan. Protected by CRON_SECRET.

## POST /api/escalation
Generates AI summary for human handoff. Takes conversationId.

## GET /api/conversation
Returns full message history for a conversation.
