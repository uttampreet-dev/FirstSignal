// FirstSignal agent system — every module the orchestrator coordinates.
// lib/orchestrator.ts runs these on each message and records a decision trace.

export { runPipeline } from '../orchestrator'           // Orchestrator — coordinates the pipeline
export { analyzeSentiment } from '../sentiment'          // Sentiment Agent — scores every message
export { getRelevantMemories, extractAndSaveMemory } from '../memory' // Memory Agent — pgvector semantic recall
export { buildTools, parseToolCalls } from '../tools'    // Tool schemas for LLM function calling
export { scanForInjection, checkAction, POLICY } from '../guardrails'  // Guardrails — policy layer before execution
export { processRefund, applyDiscount, markRedelivery, escalateToHuman } from '../resolution' // Resolution Engine
export { checkAndTriggerOutreach } from '../proactive-outreach'        // Proactive Agent — cron outreach
export { computeHealth } from '../health'                // Health trajectory — churn early-warning
