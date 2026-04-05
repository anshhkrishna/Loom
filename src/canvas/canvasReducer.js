import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import { generateId } from '../lib/idgen'

export const initialState = {
  nodes: [],
  edges: [],
  editingNodeId: null,
  embeddings: new Map(),
}

export function canvasReducer(state, { type, payload }) {
  switch (type) {

    case 'CREATE_NODE': {
      const { id, position } = payload
      const newNode = {
        id,
        type: 'thought',
        position,
        data: { label: '', isEditing: true, isExiting: false },
        selected: false,
      }
      return {
        ...state,
        nodes: [...state.nodes, newNode],
        editingNodeId: id,
      }
    }

    case 'UPDATE_LABEL': {
      const newEmbeddings = new Map(state.embeddings)
      newEmbeddings.delete(payload.id)
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === payload.id
            ? { ...n, data: { ...n.data, label: payload.label } }
            : n
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
          n.id === payload.id
            ? { ...n, data: { ...n.data, isEditing: false } }
            : n
        ),
        editingNodeId: state.editingNodeId === payload.id ? null : state.editingNodeId,
      }

    case 'BEGIN_DELETE':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          n.id === payload.id
            ? { ...n, data: { ...n.data, isExiting: true } }
            : n
        ),
      }

    case 'CONFIRM_DELETE': {
      const newEmbeddings = new Map(state.embeddings)
      newEmbeddings.delete(payload.id)
      return {
        ...state,
        nodes: state.nodes.filter(n => n.id !== payload.id),
        edges: state.edges.filter(
          e => e.source !== payload.id && e.target !== payload.id
        ),
        embeddings: newEmbeddings,
      }
    }

    case 'CLEAR_SMART_EDGES':
      return { ...state, edges: state.edges.filter(e => !e.data?.score) }

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
