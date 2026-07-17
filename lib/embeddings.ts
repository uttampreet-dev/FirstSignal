// Local embedding engine — all-MiniLM-L6-v2 (384-dim) running in-process via ONNX.
// Zero per-query API cost, no external embedding provider, works on Vercel serverless.
// The model (~23MB quantized) is downloaded once and cached; subsequent calls are ~10ms.

let extractorPromise: Promise<any> | null = null

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers')
      // Serverless filesystems are read-only except /tmp
      env.cacheDir = process.env.VERCEL ? '/tmp/hf-cache' : './.hf-cache'
      return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' })
    })()
  }
  return extractorPromise
}

export const EMBEDDING_DIM = 384

// Last load/inference failure — surfaced by the /api/test diagnostic.
export let lastEmbeddingError: string | null = null

// Returns a normalized 384-dim embedding, or null if the model can't load
// (callers fall back to recency-based retrieval — the system degrades, never breaks).
export async function embed(text: string): Promise<number[] | null> {
  try {
    const extractor = await getExtractor()
    const output = await extractor(text.slice(0, 512), { pooling: 'mean', normalize: true })
    return Array.from(output.data as Float32Array)
  } catch (err) {
    console.error('EMBEDDING ERROR (falling back to recency retrieval):', err)
    lastEmbeddingError = err instanceof Error ? `${err.message} | ${err.stack?.split('\n').slice(0, 4).join(' ')}` : String(err)
    extractorPromise = null // allow retry on next call rather than caching a rejection
    return null
  }
}
