import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function analyzeSentiment(message: string): Promise<{
  score: number
  label: 'positive' | 'neutral' | 'negative' | 'frustrated'
  churnRisk: boolean
  buyingIntent: boolean
}> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a sentiment analyzer for a D2C e-commerce support system. 
Analyze the customer message and respond with ONLY a JSON object, nothing else.
Format: {"score": 0-100, "label": "positive|neutral|negative|frustrated", "churnRisk": true/false, "buyingIntent": true/false}
Score guide: 0-20=extremely frustrated, 21-40=negative, 41-60=neutral, 61-80=positive, 81-100=very happy
churnRisk: true if customer seems about to leave or cancel
buyingIntent: true if customer wants to buy something`
      },
      { role: 'user', content: message }
    ],
    max_tokens: 100,
    temperature: 0.1
  })

  try {
    const text = completion.choices[0].message.content || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return { score: 50, label: 'neutral', churnRisk: false, buyingIntent: false }
  }
}
