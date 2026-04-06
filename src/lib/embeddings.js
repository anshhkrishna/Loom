import OpenAI from 'openai'

export function detectProvider(key) {
  if (!key) return null
  if (key.startsWith('sk-ant-')) return 'anthropic'
  if (key.startsWith('sk-')) return 'openai'
  if (key.startsWith('AIza')) return 'gemini'
  return null
}

async function openaiEmbedding(text, apiKey) {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return res.data[0].embedding
}

async function geminiEmbedding(text, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`)
  }
  const data = await res.json()
  return data.embedding.values
}

export async function fetchEmbedding(text, apiKey) {
  if (!text?.trim() || !apiKey) return null
  const provider = detectProvider(apiKey)
  if (provider === 'openai') return openaiEmbedding(text.trim(), apiKey)
  if (provider === 'gemini') return geminiEmbedding(text.trim(), apiKey)
  if (provider === 'anthropic') return null // no embeddings API — smart connections unavailable
  throw new Error('Unrecognized API key format')
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
