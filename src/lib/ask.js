import OpenAI from 'openai'
import { detectProvider } from './embeddings'

const NODE_SYSTEM_PROMPT = 'you are a thinking assistant. given a thought and its connected ideas, help the user explore, synthesize, or question them. be concise and direct. 2-4 sentences max.'

const CANVAS_SYSTEM_PROMPT = `you are a thinking assistant helping the user think through their ideas.

answer questions fully and helpfully using your knowledge. when the user's notes contain content relevant to your answer, cite those specific nodes inline using [1], [2], etc. you may cite multiple nodes like [1][3].

be concise and direct. connect your answer back to the user's actual thoughts wherever possible.`

function buildNodePrompt(question, nodeLabel, connectedNodes) {
  let ctx = `this thought: "${nodeLabel}"`
  if (connectedNodes.length > 0) {
    ctx += `\n\nconnected thoughts:\n${connectedNodes
      .map(n => `- "${n.label}" (similarity: ${n.score?.toFixed(2)})`)
      .join('\n')}`
  }
  return `${ctx}\n\nquestion: ${question}`
}

function buildCanvasPrompt(question, clusterSections, crossEdges, targetSection) {
  const lines = []

  if (targetSection) {
    lines.push(targetSection)
  } else {
    if (clusterSections.length === 0) {
      lines.push('no thoughts on the canvas yet.')
    } else {
      lines.push(clusterSections.join('\n\n'))
    }
    if (crossEdges.length > 0) {
      lines.push('\ncross-cluster connections:\n' + crossEdges.join('\n'))
    }
  }

  lines.push(`\nquestion: ${question}`)
  return lines.join('\n')
}

async function callOpenAI(systemPrompt, messages, apiKey) {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: 350,
  })
  return res.choices[0].message.content.trim()
}

async function callGemini(systemPrompt, messages, apiKey) {
  const geminiContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: geminiContents,
        generationConfig: { maxOutputTokens: 350 },
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

async function callAnthropic(systemPrompt, messages, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      system: systemPrompt,
      messages,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `error ${res.status}`)
  }
  const data = await res.json()
  return data.content[0].text.trim()
}

async function callAI(systemPrompt, messages, apiKey) {
  const provider = detectProvider(apiKey)
  if (provider === 'openai') return callOpenAI(systemPrompt, messages, apiKey)
  if (provider === 'gemini') return callGemini(systemPrompt, messages, apiKey)
  if (provider === 'anthropic') return callAnthropic(systemPrompt, messages, apiKey)
  throw new Error('unrecognized api key format')
}

export async function askAboutNode(question, nodeLabel, connectedNodes, apiKey) {
  if (!apiKey) throw new Error('no api key')
  const prompt = buildNodePrompt(question, nodeLabel, connectedNodes)
  return callAI(NODE_SYSTEM_PROMPT, [{ role: 'user', content: prompt }], apiKey)
}

export async function askAboutCanvas(question, clusterSections, crossEdges, apiKey, history, targetSection) {
  if (!apiKey) throw new Error('no api key')
  const prompt = buildCanvasPrompt(question, clusterSections, crossEdges, targetSection)
  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt },
  ]
  return callAI(CANVAS_SYSTEM_PROMPT, messages, apiKey)
}
