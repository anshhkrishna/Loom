import { useReducer, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './CanvasFlow.css'

import { canvasReducer, initialState } from './canvasReducer'
import { CanvasDispatchContext } from './canvasContext'
import { ThoughtNode } from '../nodes/ThoughtNode'
import { FloatingEdge } from '../edges/FloatingEdge'
import { useClickToCreate } from '../hooks/useClickToCreate'
import { useDeleteNode } from '../hooks/useDeleteNode'
import { useSmartConnect } from '../hooks/useSmartConnect'

const nodeTypes = { thought: ThoughtNode }
const edgeTypes = { floating: FloatingEdge }
const defaultEdgeOptions = { type: 'floating', animated: false }

function HintOverlay({ nodeCount, edgeCount }) {
  const showPrimary = nodeCount === 0
  const showSecondary = nodeCount > 0 && edgeCount === 0

  return (
    <div className="hint-overlay">
      <p className={`hint-primary ${showPrimary ? 'hint--visible' : 'hint--hidden'}`}>
        Click anywhere to start a thought
      </p>
      <p className={`hint-secondary ${showSecondary ? 'hint--visible' : 'hint--hidden'}`}>
        Keep adding. Connections will form.
      </p>
    </div>
  )
}

export function CanvasFlow({ apiKey }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState)
  const { nodes, edges, embeddings } = state

  const onNodesChange = useCallback(
    (changes) => dispatch({ type: 'NODES_CHANGE', payload: { changes } }),
    []
  )
  const onEdgesChange = useCallback(
    (changes) => dispatch({ type: 'EDGES_CHANGE', payload: { changes } }),
    []
  )
  const onNodeDoubleClick = useCallback(
    (_, node) => dispatch({ type: 'SET_EDITING', payload: { id: node.id } }),
    []
  )

  useDeleteNode(nodes, dispatch)
  useSmartConnect(nodes, embeddings, dispatch, apiKey)

  return (
    <CanvasDispatchContext.Provider value={dispatch}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <HintOverlay nodeCount={nodes.length} edgeCount={edges.length} />
        <ReactFlowInner
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDoubleClick={onNodeDoubleClick}
          dispatch={dispatch}
        />
      </div>
    </CanvasDispatchContext.Provider>
  )
}

function ReactFlowInner({ nodes, edges, onNodesChange, onEdgesChange, onNodeDoubleClick, dispatch }) {
  const handlePaneClick = useClickToCreate(dispatch)

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
      colorMode="dark"
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={32}
        size={1}
        color="rgba(255,255,255,0.04)"
        bgColor="#0b0b0c"
      />
    </ReactFlow>
  )
}
