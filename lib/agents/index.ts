// FirstSignal Multi-Agent Architecture
// Each agent is a specialized AI module with its own model call and decision logic

export { analyzeSentiment as SentimentAgent } from '../sentiment'
export { getMemories, extractAndSaveMemory as MemoryAgent } from '../memory'
export { detectAction as RetentionAgent } from '../action-detector'
export { processRefund, applyDiscount, markRedelivery, escalateToHuman } from '../resolution'
export { checkAndTriggerOutreach as ProactiveAgent } from '../proactive-outreach'
