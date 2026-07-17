import Groq from 'groq-sdk'
import { MODEL } from '@/lib/llm'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function analyzeSentiment(message: string): Promise<{
  score: number
  label: 'positive' | 'neutral' | 'negative' | 'frustrated'
  churnRisk: boolean
  buyingIntent: boolean
}> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a sentiment analyzer for a D2C e-commerce support system. 
Analyze the customer message and respond with ONLY a JSON object, nothing else.
Format: {"score": 0-100, "label": "positive|neutral|negative|frustrated", "churnRisk": true/false, "buyingIntent": true/false}
Score guide: 0-20=extremely frustrated or threatening to leave, 21-40=clearly upset/complaining, 41-60=neutral, 61-80=positive, 81-100=very happy
Plain questions or status requests (tracking, policy, address changes) are neutral (46-60) even if slightly impatient.
churnRisk: true ONLY if the customer explicitly or strongly signals they will leave — cancelling, "never ordering again", switching brands, repeated unresolved failures ("third time"), or legal/consumer-complaint threats. An ordinary complaint or a single bad experience is NOT churn risk.
buyingIntent: true if customer wants to buy something
Customers may write in Hindi or Hinglish — interpret meaning, not just keywords.`
      },
      { role: 'user', content: message }
    ],
    max_tokens: 300,
    temperature: 0.1
  })

  const fallback = { score: 50, label: 'neutral' as const, churnRisk: false, buyingIntent: false }
  try {
    const text = completion.choices[0].message.content || '{}'
    // Extract the first JSON object — tolerates fences, prose, or reasoning text around it
    const json = text.match(/\{[\s\S]*\}/)?.[0] ?? '{}'
    const parsed = JSON.parse(json)
    if (typeof parsed.score !== 'number') return fallback
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      label: parsed.label ?? 'neutral',
      churnRisk: Boolean(parsed.churnRisk),
      buyingIntent: Boolean(parsed.buyingIntent)
    }
  } catch {
    return fallback
  }
}
