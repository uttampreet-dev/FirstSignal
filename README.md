# FirstSignal — Autonomous Customer Intelligence Platform

> Detect customer frustration before it becomes churn.

An AI-powered customer intelligence platform that helps D2C brands identify at-risk customers, automate issue resolution, and proactively retain customers through memory, sentiment analysis, intelligent workflows, and voice escalation.

**Live Demo:** https://first-signal-six.vercel.app  
**Chat:** https://first-signal-six.vercel.app/chat  
**Dashboard:** https://first-signal-six.vercel.app/dashboard

---

## The Problem

Customer support teams are reactive by default.

By the time a customer reaches support, frustration has already built up, trust has declined, and churn may already be inevitable. Traditional chatbots answer questions — they do not understand customer history, monitor customer health, predict churn risk, or take proactive action.

Businesses need systems that detect problems before customers leave.

---

## The Solution

FirstSignal transforms customer care from reactive support into proactive customer retention.

The platform continuously evaluates conversations, retrieves historical context, assesses sentiment, predicts churn risk, and automatically initiates recovery workflows — before dissatisfaction becomes customer loss.

---

## Multi-Agent Architecture

FirstSignal uses 6 specialized AI agents collaborating on every interaction:
Customer Message
↓
┌─────────────────┐
│ Sentiment Agent │ → Scores every message 0-100, detects frustration/churn risk
└────────┬────────┘
↓
┌─────────────────┐
│  Memory Agent   │ → Retrieves full customer history across sessions via pgvector
└────────┬────────┘
↓
┌──────────────────────┐
│ Retention Agent      │ → Evaluates churn probability, decides intervention
└────────┬─────────────┘
↓
┌──────────────────┐
│ Resolution Agent │ → Executes refunds, discounts, redeliveries autonomously
└────────┬─────────┘
↓
┌──────────────────┐
│ Proactive Agent  │ → Cron-based outreach before customers complain
└────────┬─────────┘
↓
┌─────────────────┐
│  Voice Agent    │ → VAPI browser voice callbacks for critical escalations
└─────────────────┘

---

## Core Features

### Real-Time Sentiment Intelligence
Every message scored 0-100. Frustration, churn risk, and buying intent detected instantly. System behavior changes dynamically based on score thresholds.

### Persistent Cross-Session Memory
Customers remembered across separate sessions using pgvector embeddings — past complaints, order history, sentiment patterns, resolution outcomes.

### Autonomous Resolution Engine
The platform executes real actions:
- Refund processing with unique refund IDs
- Discount code generation and application
- Express redelivery scheduling
- Human escalation with AI-generated briefings

### Proactive Customer Recovery
Cron-triggered outreach identifies delayed orders and at-risk customers before they complain. Aria initiates the conversation — not the customer.

### Voice Escalation
For critical interactions, Aria initiates live voice calls directly from the browser via VAPI. Call transcripts saved back to customer memory.

### Mission Control Dashboard
- Live conversation feed with real-time sentiment scores
- Customer health score rings (calculated from sentiment + order history + escalations)
- AI-generated business insights from live data
- Escalation alerts and autonomous action logs
- Voice callback panel

---

## Example Customer Journey

**Customer:** *"I've been waiting 6 days for my order. This is ridiculous."*

| Step | Agent | Action |
|------|-------|--------|
| 1 | Sentiment Agent | Score: 20/100 — CRITICAL, churn risk: HIGH |
| 2 | Memory Agent | Retrieves: previous delivery complaint, VIP status |
| 3 | Retention Agent | Flags: immediate intervention required |
| 4 | Resolution Agent | Applies 15% discount, generates REF-1780042847773 |
| 5 | Voice Agent | Initiates browser voice callback |
| 6 | Dashboard | Updates live — issue resolved, ₹0 human time |

---

## Business Impact

- Reduce support workload through autonomous resolution
- Improve customer satisfaction with proactive outreach
- Increase retention by detecting churn signals early
- Escalate only when human judgment is genuinely needed

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Database | Supabase (PostgreSQL + pgvector) |
| AI Model | Groq LLaMA-3.3-70B |
| Memory | pgvector embeddings |
| Voice | VAPI Web SDK |
| Deployment | Vercel |

---

## Project Structure
firstsignal/
├── app/
│   ├── page.tsx              # Landing page with live animated demo
│   ├── chat/page.tsx         # Customer chat interface
│   ├── dashboard/page.tsx    # Operator Mission Control
│   └── api/
│       ├── chat/             # Main AI conversation endpoint
│       ├── dashboard/        # Analytics + metrics API
│       ├── escalation/       # AI summary generation
│       ├── outreach/         # Proactive outreach trigger
│       ├── conversation/     # Full conversation retrieval
│       └── vapi/             # Voice callback endpoints
├── components/
│   ├── chat/                 # Chat widget components
│   └── VoiceDemo.tsx         # VAPI voice integration
└── lib/
├── agents/               # Multi-agent architecture exports
├── sentiment.ts          # Sentiment Agent
├── memory.ts             # Memory Agent
├── action-detector.ts    # Retention Agent
├── resolution.ts         # Resolution Agent
└── proactive-outreach.ts # Proactive Agent

---

## Setup

```bash
git clone https://github.com/uttampreet-dev/firstsignal.git
cd firstsignal
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
NEXT_PUBLIC_VAPI_PUBLIC_KEY=
NEXT_PUBLIC_VAPI_ASSISTANT_ID=
CRON_SECRET=
```

---

## Hackathon Category

**Customer Care Bot** — FirstSignal autonomously manages customer relationships through intelligent issue detection, proactive intervention, automated resolution, and voice escalation.

---

## Evaluation Criteria

| Criteria | Implementation |
|----------|---------------|
| **Innovation & Novelty (30%)** | Multi-agent architecture, cross-session memory, proactive outreach, voice callbacks — combination not seen in typical submissions |
| **Real-World Applicability (25%)** | Built for D2C e-commerce, Indian market context, real order/return workflows |
| **Technical Architecture (25%)** | 6 specialized agents, pgvector memory, function calling, cron jobs, WebSocket real-time updates |
| **Documentation Clarity (20%)** | Architecture diagrams, setup guide, live demo, inline code documentation |

---

## Future Enhancements

- WhatsApp & SMS channel integration
- CRM integrations (Shopify, WooCommerce)
- Multi-language support (Hindi, regional languages)
- Advanced churn prediction ML model
- Multi-brand support
- Customer segmentation engine

---

*Built with Next.js · Supabase · Groq · VAPI · Tailwind CSS*
