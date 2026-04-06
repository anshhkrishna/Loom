import { useReducer, useCallback } from 'react'
import { ReactFlow, useReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './CanvasFlow.css'

import { canvasReducer, initialState } from './canvasReducer'
import { CanvasDispatchContext, CanvasStateContext } from './canvasContext'
import { ThoughtNode } from '../nodes/ThoughtNode'
import { FloatingEdge } from '../edges/FloatingEdge'
import { ClusterLayer } from './ClusterLayer'
import { ClusterDock } from './ClusterDock'
import { ChatPanel } from './ChatPanel'
import { useClickToCreate } from '../hooks/useClickToCreate'
import { useDeleteNode } from '../hooks/useDeleteNode'
import { useSmartConnect } from '../hooks/useSmartConnect'
import { useEffect } from 'react'

const nodeTypes = { thought: ThoughtNode }
const edgeTypes = { floating: FloatingEdge }
const defaultEdgeOptions = { type: 'floating', animated: false }

function HintOverlay({ clusters, activeClusterId }) {
  const hasNoCluster = clusters.length === 0
  const hasClusterButNoActive = clusters.length > 0 && !activeClusterId

  return (
    <div className="hint-overlay">
      <p className={`hint-primary ${hasNoCluster ? 'hint--visible' : 'hint--hidden'}`}>
        create a cluster to begin
      </p>
      <p className={`hint-secondary ${hasClusterButNoActive ? 'hint--visible' : 'hint--hidden'}`}>
        open a cluster from the dock to continue
      </p>
    </div>
  )
}

export function CanvasFlow({ apiKey, theme, threshold, showChat, onCloseChat, pendingCluster, onClusterCreated }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState)
  const { nodes, edges, clusters, activeClusterId, embeddings } = state

  useEffect(() => {
    if (!pendingCluster) return
    dispatch({ type: 'CREATE_CLUSTER', payload: pendingCluster })
    onClusterCreated?.()
  }, [pendingCluster, onClusterCreated])

  const onNodesChange = useCallback(
    (changes) => dispatch({ type: 'NODES_CHANGE', payload: { changes } }),
    []
  )
  const onEdgesChange = useCallback(
    (changes) => dispatch({ type: 'EDGES_CHANGE', payload: { changes } }),
    []
  )
  const onNodeDoubleClick = useCallback(
    (_, node) => {
      if (node.type === 'thought') {
        dispatch({ type: 'SET_EDITING', payload: { id: node.id } })
      }
    },
    []
  )

  useDeleteNode(nodes, dispatch)
  useSmartConnect(nodes, embeddings, dispatch, apiKey, threshold)

  const handleCloseCluster = useCallback((id) => {
    dispatch({ type: 'CLOSE_CLUSTER', payload: { id } })
  }, [])

  const handleOpenCluster = useCallback((id) => {
    dispatch({ type: 'OPEN_CLUSTER', payload: { id } })
  }, [])

  const handleActivateCluster = useCallback((id) => {
    dispatch({ type: 'SET_ACTIVE_CLUSTER', payload: { id } })
  }, [])

  return (
    <CanvasStateContext.Provider value={{ nodes, edges, apiKey }}>
      <CanvasDispatchContext.Provider value={dispatch}>
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
          <HintOverlay clusters={clusters} activeClusterId={activeClusterId} />

          <ClusterLayer
            clusters={clusters}
            nodes={nodes}
            activeClusterId={activeClusterId}
            onClose={handleCloseCluster}
            onActivate={handleActivateCluster}
          />

          <ClusterDock
            clusters={clusters}
            nodes={nodes}
            onOpen={handleOpenCluster}
          />

          <ReactFlowInner
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDoubleClick={onNodeDoubleClick}
            dispatch={dispatch}
            activeClusterId={activeClusterId}
            theme={theme}
          />

          {showChat && (
            <ChatPanel
              clusters={clusters}
              nodes={nodes}
              edges={edges}
              apiKey={apiKey}
              dispatch={dispatch}
              onClose={onCloseChat}
              onOpenCluster={handleOpenCluster}
            />
          )}
        </div>
      </CanvasDispatchContext.Provider>
    </CanvasStateContext.Provider>
  )
}

function ReactFlowInner({ nodes, edges, onNodesChange, onEdgesChange, onNodeDoubleClick, dispatch, activeClusterId, theme }) {
  const handlePaneClick = useClickToCreate(dispatch, activeClusterId)

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onPaneClick={handlePaneClick}
      onNodeDoubleClick={onNodeDoubleClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      minZoom={0.4}
      maxZoom={2.5}
      zoomOnScroll={true}
      panOnDrag={true}
      zoomOnDoubleClick={false}
      selectionOnDrag={false}
      deleteKeyCode={null}
      colorMode={theme}
      proOptions={{ hideAttribution: true }}
      style={{ background: 'var(--canvas-bg)', transition: 'background 300ms ease' }}
    />
  )
}
