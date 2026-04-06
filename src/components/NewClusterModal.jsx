import { useState, useEffect, useRef } from 'react'
import './NewClusterModal.css'

export function NewClusterModal({ onConfirm, onCancel }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && name.trim()) {
      onConfirm(name.trim())
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="nc-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="nc-card">
        <p className="nc-label">name this cluster</p>
        <input
          ref={inputRef}
          className="nc-input"
          type="text"
          placeholder="e.g. biology notes, ideas, research..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="nc-actions">
          <button className="nc-cancel" onClick={onCancel}>cancel</button>
          <button
            className="nc-confirm"
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
          >
            create →
          </button>
        </div>
      </div>
    </div>
  )
}
