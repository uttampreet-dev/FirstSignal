// Lightweight language detection for the chat agent.
// Detects Hindi (Devanagari script) and Hinglish (romanized Hindi / Hindi+English mix)
// so the AI can reply in the customer's language. No external dependencies.

export type DetectedLanguage = 'english' | 'hindi' | 'hinglish'

export interface LanguageDetection {
  /** Fine-grained classification. */
  language: DetectedLanguage
  /** Compact code for UI indicators. */
  code: 'EN' | 'HI'
  /** True for both Hindi and Hinglish — i.e. anything that should get a Hindi-aware reply. */
  isHindi: boolean
  /** Whether the message contains any Devanagari characters. */
  hasDevanagari: boolean
}

const DEVANAGARI = /[ऀ-ॿ]/
const DEVANAGARI_GLOBAL = /[ऀ-ॿ]/g
const LATIN_LETTER = /[a-zA-Z]/

// Common romanized-Hindi tokens that rarely collide with English words.
// Used to spot Hinglish written entirely in the Latin alphabet.
const HINGLISH_TOKENS = new Set([
  'mera', 'meri', 'mere', 'mujhe', 'muje', 'kaha', 'kahan',
  'chahiye', 'chahie', 'nahi', 'nahin', 'nhi', 'kyun', 'kyu', 'kyon',
  'kaise', 'kaisa', 'kab', 'kripya', 'krpya', 'dhanyavad', 'shukriya',
  'wapas', 'vapas', 'galat', 'sahi', 'theek', 'thik', 'accha', 'acha',
  'haan', 'haa', 'paisa', 'paise', 'bhai', 'bhaiya', 'milega', 'mila',
  'hua', 'raha', 'rahi', 'rha', 'rhi', 'aap', 'aapka', 'aapke', 'kya',
  'kuch', 'kuchh', 'abhi', 'jaldi', 'order', 'refund',
])

export function detectLanguage(text: string): LanguageDetection {
  const raw = text || ''

  const devanagariMatches = raw.match(DEVANAGARI_GLOBAL)?.length ?? 0
  const hasDevanagari = devanagariMatches > 0
  const hasLatin = LATIN_LETTER.test(raw)

  // Pure/partial Devanagari → Hindi, unless it's mixed with meaningful Latin text → Hinglish.
  if (hasDevanagari) {
    const latinLetters = (raw.match(/[a-zA-Z]/g)?.length ?? 0)
    const language: DetectedLanguage = latinLetters >= 3 ? 'hinglish' : 'hindi'
    return { language, code: 'HI', isHindi: true, hasDevanagari: true }
  }

  // No Devanagari — check for romanized Hindi (Hinglish) via distinctive tokens.
  if (hasLatin) {
    const tokens = raw.toLowerCase().split(/[^a-z]+/).filter(Boolean)
    // "order"/"refund" alone are too English-y; require another Hindi token to confirm.
    const strongHits = tokens.filter(t => HINGLISH_TOKENS.has(t) && t !== 'order' && t !== 'refund').length
    if (strongHits >= 2) {
      return { language: 'hinglish', code: 'HI', isHindi: true, hasDevanagari: false }
    }
  }

  return { language: 'english', code: 'EN', isHindi: false, hasDevanagari: false }
}

/** Instruction appended to the system prompt when the customer writes in Hindi/Hinglish. */
export const HINDI_SYSTEM_INSTRUCTION =
  'The customer is writing in Hindi/Hinglish. Respond naturally in the same language they used. ' +
  'If they write in Hindi, respond in Hindi. If they write in Hinglish, respond in Hinglish. ' +
  'Keep the same warm, helpful tone.'
