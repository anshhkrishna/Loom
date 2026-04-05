import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { CanvasFlow } from './canvas/CanvasFlow'
import { ApiKeyModal, SettingsTrigger } from './components/ApiKeyModal'
import { getStoredApiKey, saveApiKey } from './lib/apiKey'

export default function App() {
  const [apiKey, setApiKey] = useState(() => getStoredApiKey())
  const [showModal, setShowModal] = useState(() => !getStoredApiKey())

  const handleSaveKey = (key) => {
    saveApiKey(key)
    setApiKey(key)
    setShowModal(false)
  }

  return (
    <>
      <ReactFlowProvider>
        <CanvasFlow apiKey={apiKey} />
        <SettingsTrigger hasKey={!!apiKey} onClick={() => setShowModal(true)} />
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
