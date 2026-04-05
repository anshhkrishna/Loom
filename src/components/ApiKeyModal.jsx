import { useState } from 'react'
import { detectProvider } from '../lib/embeddings'
import './ApiKeyModal.css'

const PROVIDER_LABELS = {
  openai: 'openai',
  gemini: 'gemini',
}

export function ApiKeyModal({ onSave, onSkip, hasKey, currentKey }) {
  const [value, setValue] = useState(currentKey || '')
  const provider = detectProvider(value.trim())

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || !provider) return
    onSave(trimmed)
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onSkip()}>
      <div className="modal-card">
        <h1 className="modal-title">loom</h1>
        <p className="modal-description">
          thoughts rarely arrive in order. drop them here, and the canvas
          finds how they connect.
        </p>

        <div className="modal-divider" />

        <form onSubmit={handleSubmit}>
          <div className="modal-label-row">
            <label className="modal-label">api key</label>
            {provider && (
              <span className="modal-provider-badge">{PROVIDER_LABELS[provider]}</span>
            )}
          </div>
          <input
            className="modal-input"
            type="password"
            placeholder="sk-... or AIzaSy..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          <p className="modal-hint">
            supports openai and gemini keys.
          </p>
          <button className="modal-button" type="submit" disabled={!provider}>
            {hasKey ? 'update key' : 'enable smart connections'}
          </button>
        </form>

        <button className="modal-skip" type="button" onClick={onSkip}>
          {hasKey ? 'cancel' : 'continue without →'}
        </button>

        <p className="modal-privacy">
          stored in your browser only. never sent to any server.
        </p>
      </div>
    </div>
  )
}

export function SettingsTrigger({ hasKey, onClick }) {
  return (
    <button className="settings-trigger" onClick={onClick} title="api settings">
      <span className={`settings-trigger__dot ${hasKey ? 'settings-trigger__dot--active' : ''}`} />
      <span className="settings-trigger__label">
        {hasKey ? 'ai on' : 'add key'}
      </span>
    </button>
  )
}
