# FirstSignal — Agent Documentation

## Multi-Agent Architecture

FirstSignal uses 6 specialized AI agents that collaborate on every customer interaction. Each agent is a dedicated module with its own AI model call, decision logic, and database operations.

---

## 1. Sentiment Agent
**File:** `lib/sentiment.ts`

Analyzes every customer message in real time.

**Input:** Raw customer message text  
**Output:** Score (0-100), label, churnRisk flag, buyingIntent flag

**Score thresholds:**
- 81-100: Very happy
- 61-80: Positive  
- 41-60: Neutral
- 21-40: Negative
- 0-20: Frustrated / Critical

**Triggers escalation** when score < 25 and churnRisk is true.

---

## 2. Memory Agent
**File:** `lib/memory.ts`

Stores and retrieves customer interaction history across sessions using pgvector embeddings.

**Storage criteria:** Saves interactions when:
- Sentiment score < 40
- Customer mentions events (wedding, function, event)
- Refund or complaint keywords detected
- Churn risk flagged

**Retrieval:** Top 5 most relevant memories retrieved on each new conversation start.

---

## 3. Retention Agent
**File:** `lib/action-detector.ts`

Analyzes the conversation to detect what action was promised or needed.

**Detects:**
- `process_refund` — refund requested and confirmed
- `apply_discount` — discount offered
- `mark_redelivery` — redelivery scheduled
- `escalate_to_human` — extreme frustration detected
- `none` — no action needed

**Auto-escalates** when sentiment score < 20 regardless of message content.

---

## 4. Resolution Agent
**File:** `lib/resolution.ts`

Executes real database actions autonomously.

**Actions:**
- `processRefund()` — Updates order status, generates unique REF-{timestamp} ID
- `applyDiscount()` — Generates unique discount code, saves to memory
- `markRedelivery()` — Updates order status, schedules express delivery
- `escalateToHuman()` — Updates conversation, generates AI briefing

---

## 5. Proactive Agent
**File:** `lib/proactive-outreach.ts`

Cron-triggered agent that identifies at-risk customers before they complain.

**Triggers:**
- Order status = delayed AND expected_delivery < now()
- Order status = processing AND expected_delivery < 5 days ago

**Deduplication:** Checks memory_embeddings before sending to avoid repeat outreach.

---

## 6. Voice Agent
**File:** `components/VoiceDemo.tsx`

Handles critical escalations through live browser-based voice calls via VAPI Web SDK.

**Trigger:** Manual from operator dashboard or automatic on extreme escalation  
**Features:** Real-time transcript, call saved to customer memory, no phone number required
