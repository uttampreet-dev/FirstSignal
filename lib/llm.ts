// Single source of truth for the chat model.
// Override with GROQ_MODEL (e.g. to a model with a separate free-tier quota
// during heavy demo recording) without touching any other file.
export const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
