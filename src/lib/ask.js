import OpenAI from 'openai'
import { detectProvider } from './embeddings'

const SYSTEM_PROMPT = 'you are a thinking assistant. given a thought and its connected ideas, help the user explore, synthesize, or question them. be concise and direct. 2-4 sentences max.'

function buildPrompt(question, nodeLabel, connectedNodes) {
  let ctx = `this thought: "${nodeLabel}"`
  if (connectedNodes.length > 0) {
    ctx += `\n\nconnected thoughts:\n${connectedNodes
      .map(n => `- "${n.label}" (similarity: ${n.score?.toFixed(2)})`)
      .join('\n')}`
  }
  return `${ctx}\n\nquestion: ${question}`
}

async function askOpenAI(prompt, apiKey) {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    max_tokens: 200,
  })
  return res.choices[0].message.content.trim()
}

async function askGemini(prompt, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
        generationConfig: { maxOutputTokens: 200 },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `error ${res.status}`)
  }
  const data = await res.json()
  return data.candidates[0].content.parts[0].text.trim()
}

export async function askAboutNode(question, nodeLabel, connectedNodes, apiKey) {
  if (!apiKey) throw new Error('no api key')
  const prompt = buildPrompt(question, nodeLabel, connectedNodes)
  const provider = detectProvider(apiKey)
  if (provider === 'openai') return askOpenAI(prompt, apiKey)
  if (provider === 'gemini') return askGemini(prompt, apiKey)
  throw new Error('unrecognized api key format')
}
