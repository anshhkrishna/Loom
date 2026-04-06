import { useState, useCallback } from 'react'
import { detectProvider } from '../lib/embeddings'
import './LandingPage.css'

export function LandingPage({ onSave }) {
  const [value, setValue] = useState('')
  const [exiting, setExiting] = useState(false)
  const provider = detectProvider(value.trim())

  const handleSubmit = useCallback((e) => {
    e?.preventDefault()
    if (!value.trim() || !provider) return
    setExiting(true)
    setTimeout(() => onSave(value.trim()), 480)
  }, [value, provider, onSave])

  const handleSkip = useCallback(() => {
    setExiting(true)
    setTimeout(() => onSave(null), 480)
  }, [onSave])

  return (
    <div className={`landing ${exiting ? 'landing--exit' : ''}`}>
      <div className="landing-content">
        <h1 className="landing-wordmark">loom</h1>
        <p className="landing-tagline">think in threads</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="landing-input-wrap">
            <input
              className="landing-input"
              type="password"
              placeholder="openai, gemini, or anthropic key"
              value={value}
              onChange={e => setValue(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            {provider && <span className="landing-provider">{provider}</span>}
          </div>
          <button className="landing-btn" type="submit" disabled={!provider}>
            begin
          </button>
        </form>

        <button className="landing-skip" onClick={handleSkip}>
          continue without a key →
        </button>

      </div>
    </div>
  )
}
