import { useState } from 'react'
import './ApiKeyModal.css'

export function ApiKeyModal({ onSave, onSkip, hasKey, currentKey }) {
  const [value, setValue] = useState(currentKey || '')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    if (!trimmed.startsWith('sk-')) {
      setError('Should start with sk-')
      return
    }
    onSave(trimmed)
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onSkip()}>
      <div className="modal-card">
        <h1 className="modal-title">Infinite Canvas</h1>
        <p className="modal-description">
          A thinking surface that quietly reveals how your ideas connect.
          Add your OpenAI key to enable semantic connections.
        </p>

        <div className="modal-divider" />

        <form onSubmit={handleSubmit}>
          <label className="modal-label">OpenAI API key</label>
          <input
            className="modal-input"
            type="password"
            placeholder="sk-..."
            value={value}
            onChange={(e) => { setValue(e.target.value); setError('') }}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          {error && <p className="modal-error">{error}</p>}
          <button className="modal-button" type="submit" disabled={!value.trim()}>
            {hasKey ? 'Update key' : 'Enable smart connections'}
          </button>
        </form>

        <button className="modal-skip" type="button" onClick={onSkip}>
          {hasKey ? 'Cancel' : 'Continue without →'}
        </button>

        <p className="modal-privacy">
          Stored in your browser only. Never sent to any server.
        </p>
      </div>
    </div>
  )
}

export function SettingsTrigger({ hasKey, onClick }) {
  return (
    <button className="settings-trigger" onClick={onClick} title="API settings">
      <span className={`settings-trigger__dot ${hasKey ? 'settings-trigger__dot--active' : ''}`} />
      <span className="settings-trigger__label">
        {hasKey ? 'AI on' : 'Add key'}
      </span>
    </button>
  )
}
