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
  const [threshold, setThreshold] = useState(() => parseFloat(localStorage.getItem('canvas_threshold') || '0.72'))

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

  const handleThresholdChange = (val) => {
    setThreshold(val)
    localStorage.setItem('canvas_threshold', val)
  }

  return (
    <>
      <ReactFlowProvider>
        <CanvasFlow apiKey={apiKey} theme={theme} threshold={threshold} />
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
            threshold={threshold}
            onThresholdChange={handleThresholdChange}
          />
        )}
      </ReactFlowProvider>
      <div className="canvas-vignette" />
      <div className="canvas-grain" />
    </>
  )
}
