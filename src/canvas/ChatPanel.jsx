import { useState, useRef, useEffect, useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { buildCanvasContext, buildSingleClusterContext } from '../lib/clusters'
import { askAboutCanvas } from '../lib/ask'
import { CLUSTER_COLORS } from './canvasReducer'
import './ChatPanel.css'

// Render a text segment handling **bold** markdown
function renderTextSegment(text, key) {
  const parts = []
  const regex = /\*\*(.+?)\*\*/g
  let last = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    parts.push(<strong key={match.index}>{match[1]}</strong>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <span key={key}>{parts}</span>
}

// Parse "[N]" citations and **bold** from AI text into renderable parts
function parseContent(text) {
  const parts = []
  const regex = /\[(\d+)\]/g
  let last = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) })
    parts.push({ type: 'cite', num: parseInt(match[1]) })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) })
  return parts
}

function collectCiteNums(text) {
  return [...new Set([...text.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1])))]
}

function MessageBubble({ msg, nodeIndex, onFocus }) {
  if (msg.role === 'user') {
    return (
      <div className="chat-panel__msg chat-panel__msg--user">
        <p>{msg.content}</p>
      </div>
    )
  }

  const parts = parseContent(msg.content)
  const citedNums = collectCiteNums(msg.content)
  const citedEntries = citedNums.map(n => nodeIndex.find(e => e.num === n)).filter(Boolean)

  return (
    <div className="chat-panel__msg chat-panel__msg--assistant">
      <p>
        {parts.map((p, i) =>
          p.type === 'text'
            ? renderTextSegment(p.content, i)
            : <button key={i} className="chat-cite" onClick={() => onFocus(nodeIndex.find(e => e.num === p.num))} title="jump to node">[{p.num}]</button>
        )}
      </p>
      {citedEntries.length > 0 && (
        <div className="chat-refs">
          {citedEntries.map(entry => (
            <button key={entry.num} className="chat-ref" onClick={() => onFocus(entry)}>
              <span className="chat-ref__num">[{entry.num}]</span>
              <span className="chat-ref__cluster">{entry.clusterName}</span>
              <span className="chat-ref__label">"{entry.label}"</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ChatPanel({ clusters, nodes, edges, apiKey, dispatch, onClose, onOpenCluster }) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [nodeIndex, setNodeIndex] = useState([])
  const [isAsking, setIsAsking] = useState(false)
  const [selectedClusterId, setSelectedClusterId] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const { fitView } = useReactFlow()

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])

  const activeClusters = clusters.filter(c =>
    nodes.some(n => n.data?.clusterId === c.id && n.data?.label?.trim())
  )

  const handleFocusNode = useCallback((entry) => {
    // Open cluster if it's closed
    const cluster = clusters.find(c => c.id === entry.clusterId)
    if (cluster && !cluster.isOpen) {
      onOpenCluster(entry.clusterId)
      // Delay fitView until nodes are visible
      setTimeout(() => {
        fitView({ nodes: [{ id: entry.nodeId }], duration: 600, padding: 0.8 })
        dispatch({ type: 'HIGHLIGHT_NODE', payload: { id: entry.nodeId } })
        setTimeout(() => dispatch({ type: 'CLEAR_HIGHLIGHT' }), 2000)
      }, 100)
    } else {
      fitView({ nodes: [{ id: entry.nodeId }], duration: 600, padding: 0.8 })
      dispatch({ type: 'HIGHLIGHT_NODE', payload: { id: entry.nodeId } })
      setTimeout(() => dispatch({ type: 'CLEAR_HIGHLIGHT' }), 2000)
    }
  }, [clusters, dispatch, fitView, onOpenCluster])

  const handleKeyDown = useCallback(async (e) => {
    if (e.key !== 'Enter' || !input.trim() || isAsking) return
    e.preventDefault()

    const question = input.trim()
    setInput('')
    setIsAsking(true)

    const userMsg = { role: 'user', content: question }
    setHistory(h => [...h, userMsg])

    try {
      let idx = []
      let clusterSections = []
      let crossEdges = []
      let targetSection = null

      if (selectedClusterId) {
        const cluster = clusters.find(c => c.id === selectedClusterId)
        if (cluster) {
          const result = buildSingleClusterContext(selectedClusterId, cluster.name, nodes, edges)
          idx = result.nodeIndex
          targetSection = result.section
        }
      } else {
        const result = buildCanvasContext(clusters, nodes, edges)
        idx = result.nodeIndex
        clusterSections = result.clusterSections
        crossEdges = result.crossEdges
      }

      setNodeIndex(idx)
      const answer = await askAboutCanvas(question, clusterSections, crossEdges, apiKey, history, targetSection)
      setHistory(h => [...h, { role: 'assistant', content: answer }])
    } catch {
      setHistory(h => [...h, { role: 'assistant', content: 'could not get a response.' }])
    }

    setIsAsking(false)
  }, [input, isAsking, clusters, nodes, edges, apiKey, history, selectedClusterId])

  const selectedCluster = clusters.find(c => c.id === selectedClusterId)

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <span className="chat-panel__title">ask about your canvas</span>
        <button className="chat-panel__close" onClick={onClose}>×</button>
      </div>

      {activeClusters.length > 0 && (
        <div className="chat-panel__clusters">
          <button
            className={`chat-panel__cluster-pill ${!selectedClusterId ? 'chat-panel__cluster-pill--active' : ''}`}
            onClick={() => setSelectedClusterId(null)}
          >
            all
          </button>
          {activeClusters.map(c => {
            const color = CLUSTER_COLORS[c.colorIdx % CLUSTER_COLORS.length]
            return (
              <button
                key={c.id}
                className={`chat-panel__cluster-pill ${selectedClusterId === c.id ? 'chat-panel__cluster-pill--active' : ''}`}
                style={{ '--cluster-accent': color.accent }}
                onClick={() => setSelectedClusterId(id => id === c.id ? null : c.id)}
              >
                <span className="chat-panel__cluster-dot" />
                {c.name}
              </button>
            )
          })}
        </div>
      )}

      <div className="chat-panel__messages">
        {history.length === 0 && (
          <p className="chat-panel__empty">
            {selectedCluster
              ? `asking about "${selectedCluster.name}"`
              : 'ask about connections, clusters, or patterns across your thoughts'}
          </p>
        )}
        {history.map((msg, i) => (
          <MessageBubble key={i} msg={msg} nodeIndex={nodeIndex} onFocus={handleFocusNode} />
        ))}
        {isAsking && (
          <div className="chat-panel__msg chat-panel__msg--assistant chat-panel__msg--loading">
            <p>...</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-panel__input-row">
        <input
          ref={inputRef}
          className="chat-panel__input"
          type="text"
          placeholder={isAsking ? '...' : 'ask anything'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAsking}
        />
      </div>
    </div>
  )
}
