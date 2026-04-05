import OpenAI from 'openai'

export async function fetchEmbedding(text, apiKey) {
  if (!text?.trim() || !apiKey) return null
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.trim(),
  })
  return response.data[0].embedding
}

export function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
