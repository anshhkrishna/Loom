import { useEffect, useRef, useCallback, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useCanvasDispatch, useCanvasState } from '../canvas/canvasContext'
import { askAboutNode } from '../lib/ask'
import './ThoughtNode.css'

export function ThoughtNode({ id, data, selected }) {
  const { label, isEditing, isExiting } = data
  const dispatch = useCanvasDispatch()
  const { nodes, edges, apiKey } = useCanvasState()
  const textareaRef = useRef(null)

  const [askValue, setAskValue] = useState('')
  const [response, setResponse] = useState('')
  const [isAsking, setIsAsking] = useState(false)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
      autoResize()
    }
  }, [isEditing, autoResize])

  const handleChange = useCallback((e) => {
    dispatch({ type: 'UPDATE_LABEL', payload: { id, label: e.target.value } })
    autoResize()
  }, [id, dispatch, autoResize])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      dispatch({ type: 'COMMIT_NODE', payload: { id } })
    }
    if (e.key === 'Escape') {
      dispatch({ type: 'COMMIT_NODE', payload: { id } })
    }
    e.stopPropagation()
  }, [id, dispatch])

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      dispatch({ type: 'COMMIT_NODE', payload: { id } })
    }, 100)
  }, [id, dispatch])

  const handleAskKeyDown = useCallback(async (e) => {
    if (e.key !== 'Enter' || !askValue.trim() || isAsking) return
    e.preventDefault()
    e.stopPropagation()

    const connectedNodes = edges
      .filter(edge => edge.source === id || edge.target === id)
      .map(edge => {
        const otherId = edge.source === id ? edge.target : edge.source
        const other = nodes.find(n => n.id === otherId)
        return { label: other?.data?.label, score: edge.data?.score }
      })
      .filter(n => n.label)

    setIsAsking(true)
    setResponse('')
    try {
      const result = await askAboutNode(askValue, label, connectedNodes, apiKey)
      setResponse(result)
      setAskValue('')
    } catch (err) {
      setResponse('could not get a response.')
    }
    setIsAsking(false)
  }, [askValue, isAsking, id, label, nodes, edges, apiKey])

  const nodeClass = [
    'thought-node',
    isExiting ? 'thought-node--exiting' : '',
    selected ? 'thought-node--selected' : '',
  ].filter(Boolean).join(' ')

  const showAsk = !isEditing && !!label && !!apiKey

  return (
    <div className={nodeClass}>
      <Handle type="target" position={Position.Left} />

      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="thought-node__textarea nodrag nopan nowheel"
          value={label}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          rows={1}
          placeholder="think..."
        />
      ) : (
        <div className="thought-node__label">
          {label || <span className="thought-node__placeholder">think...</span>}
        </div>
      )}

      {showAsk && (
        <div className="thought-node__ask nodrag nopan nowheel">
          <div className="thought-node__ask-divider" />
          {response && (
            <div className="thought-node__response">
              <p>{response}</p>
              <button className="thought-node__response-close" onClick={() => setResponse('')}>×</button>
            </div>
          )}
          <input
            className="thought-node__ask-input"
            type="text"
            placeholder={isAsking ? '...' : 'ask about this'}
            value={askValue}
            onChange={(e) => setAskValue(e.target.value)}
            onKeyDown={handleAskKeyDown}
            disabled={isAsking}
          />
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  )
}
