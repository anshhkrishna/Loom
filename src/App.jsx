import { useState, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { CanvasFlow } from './canvas/CanvasFlow'
import { ApiKeyModal, SettingsTrigger } from './components/ApiKeyModal'
import { NewClusterModal } from './components/NewClusterModal'
import { AppearancePanel } from './components/AppearancePanel'
import { LandingPage } from './components/LandingPage'
import { getStoredApiKey, saveApiKey } from './lib/apiKey'
import { generateId } from './lib/idgen'

const DARK_BG_DEFAULT = '#0b0b0c'
const LIGHT_BG_DEFAULT = '#f5f4f0'
const GRAIN_DEFAULT = 0.04

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
  const [showLanding, setShowLanding] = useState(() => !getStoredApiKey())
  const [showModal, setShowModal] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('canvas_theme') || 'dark')
  const [threshold, setThreshold] = useState(() => parseFloat(localStorage.getItem('canvas_threshold') || '0.72'))
  const [showChat, setShowChat] = useState(false)
  const [showAppearance, setShowAppearance] = useState(false)
  const [showNewCluster, setShowNewCluster] = useState(false)
  const [pendingCluster, setPendingCluster] = useState(null)
  const [darkBg, setDarkBg] = useState(() => localStorage.getItem('canvas_dark_bg') || DARK_BG_DEFAULT)
  const [lightBg, setLightBg] = useState(() => localStorage.getItem('canvas_light_bg') || LIGHT_BG_DEFAULT)
  const [grainOpacity, setGrainOpacity] = useState(() => parseFloat(localStorage.getItem('canvas_grain') ?? GRAIN_DEFAULT))

  useEffect(() => {
    const bg = theme === 'dark' ? darkBg : lightBg
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.setProperty('--canvas-bg', bg)
    document.documentElement.style.setProperty('--grain-opacity', grainOpacity)
    localStorage.setItem('canvas_theme', theme)
  }, [theme, darkBg, lightBg, grainOpacity])

  const handleSaveKey = (key) => {
    if (key) {
      saveApiKey(key)
      setApiKey(key)
    }
    setShowModal(false)
    setShowLanding(false)
  }

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const handleThresholdChange = (val) => {
    setThreshold(val)
    localStorage.setItem('canvas_threshold', val)
  }

  const handleDarkBgChange = (color) => {
    setDarkBg(color)
    localStorage.setItem('canvas_dark_bg', color)
  }

  const handleLightBgChange = (color) => {
    setLightBg(color)
    localStorage.setItem('canvas_light_bg', color)
  }

  const handleGrainChange = (val) => {
    setGrainOpacity(val)
    localStorage.setItem('canvas_grain', val)
  }

  const handleNewClusterConfirm = (name) => {
    const id = generateId()
    setPendingCluster({ id, name })
    setShowNewCluster(false)
  }

  return (
    <>
      {showLanding && <LandingPage onSave={handleSaveKey} />}
      <ReactFlowProvider>
        <CanvasFlow
          apiKey={apiKey}
          theme={theme}
          threshold={threshold}
          showChat={showChat}
          onCloseChat={() => setShowChat(false)}
          pendingCluster={pendingCluster}
          onClusterCreated={() => setPendingCluster(null)}
        />

        {/* Bottom right: primary actions */}
        <div className="controls-br">
          <button
            className="new-cluster-btn"
            onClick={() => setShowNewCluster(true)}
            title="create a new cluster"
          >
            <span className="new-cluster-btn__icon">+</span>
            <span className="new-cluster-btn__label">new cluster</span>
          </button>
          {apiKey && (
            <button
              className="chat-trigger"
              onClick={() => setShowChat(c => !c)}
              title="ask about your canvas"
            >
              <span className="chat-trigger__icon">◎</span>
              <span className="chat-trigger__label">chat</span>
            </button>
          )}
        </div>

        {/* Bottom left: visual controls */}
        <div className="controls-bl">
          <button
            className="appearance-trigger"
            onClick={() => setShowAppearance(a => !a)}
            title="appearance"
          >
            <span
              className="appearance-trigger__swatch"
              style={{ background: theme === 'dark' ? darkBg : lightBg }}
            />
            <span className="appearance-trigger__label">appearance</span>
          </button>
        </div>

        {/* Top right: settings */}
        <div className="controls-tr">
          <SettingsTrigger hasKey={!!apiKey} onClick={() => setShowModal(true)} />
        </div>

        {showAppearance && (
          <AppearancePanel
            theme={theme}
            onThemeToggle={toggleTheme}
            darkBg={darkBg}
            lightBg={lightBg}
            onDarkBgChange={handleDarkBgChange}
            onLightBgChange={handleLightBgChange}
            grainOpacity={grainOpacity}
            onGrainChange={handleGrainChange}
            onClose={() => setShowAppearance(false)}
          />
        )}
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
        {showNewCluster && (
          <NewClusterModal
            onConfirm={handleNewClusterConfirm}
            onCancel={() => setShowNewCluster(false)}
          />
        )}
      </ReactFlowProvider>
      <div className="canvas-vignette" />
      <div className="canvas-grain" />
    </>
  )
}
