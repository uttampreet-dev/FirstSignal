# FirstSignal Architecture

## System Overview

FirstSignal uses a multi-agent pipeline where 6 specialized AI agents collaborate on every customer interaction.

## Agent Pipeline

### 1. Sentiment Agent (`lib/sentiment.ts`)
- Analyzes every message using Groq LLaMA-3.3-70B
- Returns score 0-100, label, churnRisk flag, buyingIntent flag
- Triggers escalation when score < 25

### 2. Memory Agent (`lib/memory.ts`)
- Stores significant interactions in Supabase pgvector
- Retrieves relevant memories on each new conversation
- Enables cross-session personalization

### 3. Retention Agent (`lib/action-detector.ts`)
- Analyzes user message + AI reply to detect promised actions
- Classifies intent: refund, discount, redelivery, escalation
- Auto-escalates on extreme frustration regardless of message content

### 4. Resolution Agent (`lib/resolution.ts`)
- Executes database actions autonomously
- processRefund() — updates order status, generates unique refund ID
- applyDiscount() — generates unique discount code
- markRedelivery() — schedules express redelivery
- escalateToHuman() — generates AI summary for human handoff

### 5. Proactive Agent (`lib/proactive-outreach.ts`)
- Runs on scheduled cron (Supabase Edge Functions)
- Detects delayed orders, overdue deliveries
- Initiates customer-facing conversations autonomously

### 6. Voice Agent (`components/VoiceDemo.tsx`)
- VAPI Web SDK integration
- Browser-based voice calls — no phone number required
- Transcript saved to customer memory post-call

## Data Flow
Customer Message
→ Sentiment Agent (parallel with Memory Agent)
→ Memory Agent retrieves context
→ Groq LLaMA generates response using enriched context
→ Retention Agent detects action intent
→ Resolution Agent executes action
→ Memory Agent stores interaction
→ Dashboard updates via Supabase real-time

## Database Schema

- `customers` — customer profiles, VIP status, sentiment scores
- `orders` — order history, status, items
- `conversations` — conversation threads, sentiment, escalation status
- `messages` — individual messages with sentiment labels
- `memory_embeddings` — pgvector embeddings for cross-session memory
- `escalation_calls` — VAPI call records and transcripts
