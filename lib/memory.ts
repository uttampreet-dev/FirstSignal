import { supabaseAdmin } from '@/lib/supabase'

// Save an important interaction to memory
export async function saveMemory(
  customerId: string,
  content: string,
  metadata: Record<string, any>
) {
  await supabaseAdmin.from('memory_embeddings').insert({
    customer_id: customerId,
    content,
    metadata,
    // We'll use text search instead of vectors for now
    embedding: null
  })
}

// Retrieve relevant memories for a customer
export async function getMemories(
  customerId: string,
  limit: number = 5
): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('memory_embeddings')
    .select('content, metadata, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data || data.length === 0) return []

  return data.map(m => {
    const date = new Date(m.created_at).toLocaleDateString('en-IN')
    return `[${date}] ${m.content}`
  })
}

// Extract and save memories from a conversation turn
export async function extractAndSaveMemory(
  customerId: string,
  userMessage: string,
  aiReply: string,
  sentiment: any
) {
  // Save significant interactions as memories
  const isSignificant =
    sentiment.score < 40 ||
    sentiment.churnRisk ||
    userMessage.toLowerCase().includes('refund') ||
    userMessage.toLowerCase().includes('cancel') ||
    userMessage.toLowerCase().includes('wrong') ||
    userMessage.toLowerCase().includes('damaged') ||
    userMessage.toLowerCase().includes('missing') ||
    userMessage.toLowerCase().includes('delay') ||
    userMessage.toLowerCase().includes('function') ||
    userMessage.toLowerCase().includes('wedding') ||
    userMessage.toLowerCase().includes('event')

  if (isSignificant) {
    const memoryContent = `Customer said: "${userMessage.slice(0, 200)}" | Agent responded with: "${aiReply.slice(0, 200)}" | Sentiment: ${sentiment.label} (${sentiment.score}/100)`

    await saveMemory(customerId, memoryContent, {
      sentiment: sentiment.label,
      score: sentiment.score,
      churnRisk: sentiment.churnRisk,
      timestamp: new Date().toISOString()
    })
  }
}
