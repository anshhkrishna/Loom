import { useState, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { CanvasFlow } from './canvas/CanvasFlow'
import { ApiKeyModal, SettingsTrigger } from './components/ApiKeyModal'
import { getStoredApiKey, saveApiKey } from './lib/apiKey'

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="theme-toggle" onClick={onToggle} title="toggle theme">
      <span className="theme-toggle__icon">{theme === 'dark' ? '○' : '●'}</span>
      <span className="theme-toggle__label">{theme === 'dark' ? 'light' : 'dark'}</span>
    </button>
  )
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => getStoredApiKey())
  const [showModal, setShowModal] = useState(() => !getStoredApiKey())
  const [theme, setTheme] = useState(() => localStorage.getItem('canvas_theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('canvas_theme', theme)
  }, [theme])

  const handleSaveKey = (key) => {
    saveApiKey(key)
    setApiKey(key)
    setShowModal(false)
  }

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <>
      <ReactFlowProvider>
        <CanvasFlow apiKey={apiKey} theme={theme} />
        <div className="bottom-controls">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <SettingsTrigger hasKey={!!apiKey} onClick={() => setShowModal(true)} />
        </div>
        {showModal && (
          <ApiKeyModal
            onSave={handleSaveKey}
            onSkip={() => setShowModal(false)}
            hasKey={!!apiKey}
            currentKey={apiKey}
          />
        )}
      </ReactFlowProvider>
      <div className="canvas-vignette" />
      <div className="canvas-grain" />
    </>
  )
}
