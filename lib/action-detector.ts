import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export interface DetectedAction {
  action: 'process_refund' | 'apply_discount' | 'mark_redelivery' | 'escalate_to_human' | 'none'
  orderId?: string
  discountPercentage?: number
  reason?: string
}

export async function detectAction(
  userMessage: string,
  aiReply: string,
  sentiment: any
): Promise<DetectedAction> {
  // Auto-escalate on extreme frustration
  if (sentiment.score < 20 && sentiment.churnRisk) {
    return { action: 'escalate_to_human', reason: 'Extreme frustration detected' }
  }

  const userLower = userMessage.toLowerCase()
  const aiLower = aiReply.toLowerCase()
  
  if ((userLower.includes('refund') || userLower.includes('money back')) && 
      (aiLower.includes('refund') || aiLower.includes('processing'))) {
    const orderMatch = aiReply.match(/ORD-\d+/)
    return { 
      action: 'process_refund', 
      orderId: orderMatch ? orderMatch[0] : 'ORD-2847',
      reason: 'Refund requested and confirmed by agent'
    }
  }

  if ((userLower.includes('discount') || userLower.includes('coupon')) &&
      aiLower.includes('discount')) {
    return { action: 'apply_discount', discountPercentage: 15 }
  }

  if ((userLower.includes('redeliver') || userLower.includes('resend') || userLower.includes('send again')) &&
      aiLower.includes('deliver')) {
    return { action: 'mark_redelivery', orderId: 'ORD-2847' }
  }

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You detect what support action was promised in an AI reply. Respond ONLY with JSON.
Actions: process_refund, apply_discount, mark_redelivery, escalate_to_human, none
Format: {"action": "action_name", "orderId": "ORD-XXXX or null", "discountPercentage": 10-15 or null, "reason": "string or null"}
Only trigger an action if the AI reply explicitly promises it.`
      },
      {
        role: 'user',
        content: `Customer said: "${userMessage}"\nAgent replied: "${aiReply}"`
      }
    ],
    max_tokens: 100,
    temperature: 0.1
  })

  try {
    const text = completion.choices[0].message.content || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return { action: 'none' }
  }
}
