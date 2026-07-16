import { supabaseAdmin } from '@/lib/supabase'
import { embed } from '@/lib/embeddings'

// Memory Agent — persistent cross-session memory backed by pgvector.
// Every significant interaction is embedded (all-MiniLM-L6-v2, 384-dim) and
// retrieved later by cosine similarity against the current message, so Aria
// recalls what's *relevant*, not just what's recent.

export interface MemoryRetrieval {
  memories: string[]
  /** 'semantic' = pgvector cosine search; 'recency' = fallback when embedding unavailable */
  mode: 'semantic' | 'recency'
  /** Top cosine similarity of the retrieved set (semantic mode only) */
  topSimilarity: number | null
}

// Save an interaction to memory with its embedding
export async function saveMemory(
  customerId: string,
  content: string,
  metadata: Record<string, any>
) {
  const embedding = await embed(content)
  await supabaseAdmin.from('memory_embeddings').insert({
    customer_id: customerId,
    content,
    metadata,
    embedding
  })
}

// Retrieve the memories most relevant to the current message via pgvector
// cosine similarity. Falls back to recency ordering if the embedding model
// or the match_memories RPC is unavailable — degrades, never breaks.
export async function getRelevantMemories(
  customerId: string,
  query: string,
  limit: number = 5
): Promise<MemoryRetrieval> {
  const queryEmbedding = query.trim() ? await embed(query) : null

  if (queryEmbedding) {
    const { data, error } = await supabaseAdmin.rpc('match_memories', {
      p_customer_id: customerId,
      query_embedding: queryEmbedding,
      match_count: limit,
      min_similarity: 0.25
    })

    if (!error && data && data.length > 0) {
      return {
        memories: data.map((m: any) => {
          const date = new Date(m.created_at).toLocaleDateString('en-IN')
          return `[${date} · relevance ${(m.similarity * 100).toFixed(0)}%] ${m.content}`
        }),
        mode: 'semantic',
        topSimilarity: data[0].similarity
      }
    }
    if (error) console.error('match_memories RPC error (run the SQL migration?):', error.message)
  }

  // Fallback: most recent memories
  const { data } = await supabaseAdmin
    .from('memory_embeddings')
    .select('content, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return {
    memories: (data || []).map(m => {
      const date = new Date(m.created_at).toLocaleDateString('en-IN')
      return `[${date}] ${m.content}`
    }),
    mode: 'recency',
    topSimilarity: null
  }
}

// Decide whether a conversation turn is worth remembering, and store it.
// Significant = emotionally charged, churn-risky, or contains a concrete
// issue/commitment that future conversations will need.
export async function extractAndSaveMemory(
  customerId: string,
  userMessage: string,
  aiReply: string,
  sentiment: any,
  actionTaken?: string | null
) {
  const isSignificant =
    sentiment.score < 45 ||
    sentiment.churnRisk ||
    Boolean(actionTaken) ||
    /refund|cancel|wrong|damaged|missing|delay|broken|spoiled|warranty|wedding|event|function/i.test(userMessage)

  if (!isSignificant) return

  const memoryContent =
    `Customer said: "${userMessage.slice(0, 200)}" | Agent responded: "${aiReply.slice(0, 200)}"` +
    (actionTaken ? ` | Action taken: ${actionTaken}` : '') +
    ` | Sentiment: ${sentiment.label} (${sentiment.score}/100)`

  await saveMemory(customerId, memoryContent, {
    sentiment: sentiment.label,
    score: sentiment.score,
    churnRisk: sentiment.churnRisk,
    action: actionTaken || undefined,
    timestamp: new Date().toISOString()
  })
}

// Backwards-compatible recency read (used by escalation briefings)
export async function getMemories(customerId: string, limit: number = 5): Promise<string[]> {
  const { memories } = await getRelevantMemories(customerId, '', limit)
  return memories
}
