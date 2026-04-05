import { useEffect, useRef, useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useCanvasDispatch } from '../canvas/canvasContext'
import './ThoughtNode.css'

export function ThoughtNode({ id, data, selected }) {
  const { label, isEditing, isExiting } = data
  const dispatch = useCanvasDispatch()
  const textareaRef = useRef(null)

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

  const nodeClass = [
    'thought-node',
    isExiting ? 'thought-node--exiting' : '',
    selected ? 'thought-node--selected' : '',
  ].filter(Boolean).join(' ')

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
          placeholder="Think..."
        />
      ) : (
        <div className="thought-node__label">
          {label || <span className="thought-node__placeholder">Think...</span>}
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  )
}
