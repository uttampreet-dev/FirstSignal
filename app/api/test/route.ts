import { NextResponse } from 'next/server'
import { embed, lastEmbeddingError } from '@/lib/embeddings'

// Health check + embedding-engine diagnostic.
export async function GET() {
  const started = Date.now()
  try {
    const vector = await embed('diagnostic: embedding engine health check')
    return NextResponse.json({
      status: 'API routing works',
      embeddings: vector ? `ok — ${vector.length}-dim in ${Date.now() - started}ms` : 'unavailable (recency fallback active)',
      lastError: lastEmbeddingError
    })
  } catch (err) {
    return NextResponse.json({
      status: 'API routing works',
      embeddings: 'error',
      detail: err instanceof Error ? `${err.message}\n${err.stack?.slice(0, 800)}` : String(err)
    })
  }
}
