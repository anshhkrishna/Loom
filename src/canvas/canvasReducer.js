import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import { generateId } from '../lib/idgen'

export const CLUSTER_COLORS = [
  { bg: 'rgba(100, 160, 255, 0.10)', accent: 'rgba(100, 160, 255, 0.55)' },
  { bg: 'rgba(180, 120, 255, 0.09)', accent: 'rgba(180, 120, 255, 0.50)' },
  { bg: 'rgba(80, 210, 170, 0.09)', accent: 'rgba(80, 210, 170, 0.50)' },
  { bg: 'rgba(255, 160, 90, 0.09)', accent: 'rgba(255, 160, 90, 0.50)' },
  { bg: 'rgba(255, 100, 150, 0.09)', accent: 'rgba(255, 100, 150, 0.50)' },
  { bg: 'rgba(150, 210, 70, 0.08)', accent: 'rgba(150, 210, 70, 0.48)' },
]

export const initialState = {
  nodes: [],
  edges: [],
  clusters: [],
  activeClusterId: null,
  editingNodeId: null,
  embeddings: new Map(),
}

function updateEdgeVisibility(edges, nodes) {
  const hiddenNodeIds = new Set(nodes.filter(n => n.hidden).map(n => n.id))
  return edges.map(e => ({
    ...e,
    hidden: hiddenNodeIds.has(e.source) || hiddenNodeIds.has(e.target),
  }))
}

function collapseCluster(state, id) {
  const cluster = state.clusters.find(c => c.id === id)
  if (!cluster || !cluster.isOpen) return state

  const clusterNodeIds = new Set(
    state.nodes.filter(n => n.data?.clusterId === id).map(n => n.id)
  )
  const updatedNodes = state.nodes.map(n =>
    clusterNodeIds.has(n.id) ? { ...n, hidden: true } : n
  )

  return {
    ...state,
    nodes: updatedNodes,
    edges: updateEdgeVisibility(state.edges, updatedNodes),
    clusters: state.clusters.map(c => c.id === id ? { ...c, isOpen: false } : c),
    activeClusterId: state.activeClusterId === id ? null : state.activeClusterId,
  }
}

export function canvasReducer(state, { type, payload }) {
  switch (type) {

    case 'CREATE_CLUSTER': {
      const { id, name } = payload
      const colorIdx = state.clusters.length % CLUSTER_COLORS.length
      const stateAfterCollapse = state.activeClusterId
        ? collapseCluster(state, state.activeClusterId)
        : state
      return {
        ...stateAfterCollapse,
        clusters: [...stateAfterCollapse.clusters, { id, name, colorIdx, isOpen: true, lastNodeId: null }],
        activeClusterId: id,
      }
    }

    case 'CLOSE_CLUSTER':
      return collapseCluster(state, payload.id)

    case 'OPEN_CLUSTER': {
      const { id } = payload
      const updatedNodes = state.nodes.map(n =>
        n.data?.clusterId === id ? { ...n, hidden: false } : n
      )
      return {
        ...state,
        nodes: updatedNodes,
        edges: updateEdgeVisibility(state.edges, updatedNodes),
        clusters: state.clusters.map(c => c.id === id ? { ...c, isOpen: true } : c),
        activeClusterId: id,
      }
    }

    case 'SET_ACTIVE_CLUSTER': {
      const cluster = state.clusters.find(c => c.id === payload.id)
      if (!cluster?.isOpen) return state
      return { ...state, activeClusterId: payload.id }
    }

    case 'CREATE_NODE': {
      const { id, position, clusterId } = payload
      const newNode = {
        id,
        type: 'thought',
        position,
        data: { label: '', isEditing: true, isExiting: false, clusterId },
        selected: false,
      }
      let newEdges = [...state.edges]
      const updatedClusters = state.clusters.map(c => {
        if (c.id !== clusterId) return c
        if (c.lastNodeId) {
          newEdges.push({
            id: generateId(),
            source: c.lastNodeId,
            target: id,
            type: 'floating',
            data: { isChain: true },
          })
        }
        return { ...c, lastNodeId: id }
      })
      return {
        ...state,
        nodes: [...state.nodes, newNode],
        edges: newEdges,
        clusters: updatedClusters,
        editingNodeId: id,
      }
    }

    case 'UPDATE_LABEL': {
      const newEmbeddings = new Map(state.embeddings)
      newEmbeddings.delete(payload.id)
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === payload.id ? { ...n, data: { ...n.data, label: payload.label } } : n
        ),
        embeddings: newEmbeddings,
      }
    }

    case 'SET_EDITING':
      return {
        ...state,
        nodes: state.nodes.map(n => ({
          ...n,
          data: { ...n.data, isEditing: n.id === payload.id },
        })),
        editingNodeId: payload.id,
      }

    case 'COMMIT_NODE':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === payload.id ? { ...n, data: { ...n.data, isEditing: false } } : n
        ),
        editingNodeId: state.editingNodeId === payload.id ? null : state.editingNodeId,
      }

    case 'BEGIN_DELETE':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === payload.id ? { ...n, data: { ...n.data, isExiting: true } } : n
        ),
      }

    case 'CONFIRM_DELETE': {
      const { id } = payload
      const newEmbeddings = new Map(state.embeddings)
      newEmbeddings.delete(id)
      const updatedClusters = state.clusters.map(c => {
        if (c.lastNodeId !== id) return c
        const remaining = state.nodes.filter(n => n.data?.clusterId === c.id && n.id !== id)
        return { ...c, lastNodeId: remaining.length > 0 ? remaining[remaining.length - 1].id : null }
      })
      return {
        ...state,
        nodes: state.nodes.filter(n => n.id !== id),
        edges: state.edges.filter(e => e.source !== id && e.target !== id),
        embeddings: newEmbeddings,
        clusters: updatedClusters,
      }
    }

    case 'HIGHLIGHT_NODE': {
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === payload.id
            ? { ...n, data: { ...n.data, isHighlighted: true } }
            : { ...n, data: { ...n.data, isHighlighted: false } }
        ),
      }
    }

    case 'CLEAR_HIGHLIGHT':
      return {
        ...state,
        nodes: state.nodes.map(n => ({ ...n, data: { ...n.data, isHighlighted: false } })),
      }

    case 'CLEAR_SMART_EDGES':
      return { ...state, edges: state.edges.filter(e => e.data?.isChain || !e.data?.score) }

    case 'NODES_CHANGE':
      return { ...state, nodes: applyNodeChanges(payload.changes, state.nodes) }

    case 'EDGES_CHANGE':
      return { ...state, edges: applyEdgeChanges(payload.changes, state.edges) }

    case 'ADD_SMART_EDGE': {
      const { source, target, score } = payload
      const exists = state.edges.some(
        e => (e.source === source && e.target === target) ||
             (e.source === target && e.target === source)
      )
      if (exists) return state
      return {
        ...state,
        edges: [...state.edges, {
          id: generateId(),
          source,
          target,
          type: 'floating',
          data: { score },
        }],
      }
    }

    case 'SET_EMBEDDING': {
      const newEmbeddings = new Map(state.embeddings)
      newEmbeddings.set(payload.id, payload.vector)
      return { ...state, embeddings: newEmbeddings }
    }

    default:
      return state
  }
}
