import { useEffect, useRef } from 'react'
import { fetchEmbedding, cosineSimilarity } from '../lib/embeddings'

const DEBOUNCE_MS = 1000

export function useSmartConnect(nodes, embeddings, dispatch, apiKey, threshold) {
  const timers = useRef({})
  const embeddingsRef = useRef(embeddings)
  const nodesRef = useRef(nodes)

  useEffect(() => { embeddingsRef.current = embeddings }, [embeddings])
  useEffect(() => { nodesRef.current = nodes }, [nodes])

  // Rebuild all smart edges when threshold changes
  useEffect(() => {
    dispatch({ type: 'CLEAR_SMART_EDGES' })
    const ids = [...embeddingsRef.current.keys()]
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const nodeA = nodesRef.current.find(n => n.id === ids[i])
        const nodeB = nodesRef.current.find(n => n.id === ids[j])
        // Only connect nodes from different clusters
        if (nodeA?.data?.clusterId && nodeA.data.clusterId === nodeB?.data?.clusterId) continue
        const score = cosineSimilarity(
          embeddingsRef.current.get(ids[i]),
          embeddingsRef.current.get(ids[j])
        )
        if (score >= threshold) {
          dispatch({ type: 'ADD_SMART_EDGE', payload: { source: ids[i], target: ids[j], score } })
        }
      }
    }
  }, [threshold, dispatch])

  // Embed new committed nodes and connect to similar nodes in other clusters
  useEffect(() => {
    if (!apiKey) return

    nodes.forEach(node => {
      if (node.data.isEditing || !node.data.label || node.hidden) return
      if (embeddingsRef.current.has(node.id)) return

      clearTimeout(timers.current[node.id])
      timers.current[node.id] = setTimeout(async () => {
        try {
          const vector = await fetchEmbedding(node.data.label, apiKey)
          if (!vector) return

          dispatch({ type: 'SET_EMBEDDING', payload: { id: node.id, vector } })

          embeddingsRef.current.forEach((otherVector, otherId) => {
            if (otherId === node.id) return
            const otherNode = nodesRef.current.find(n => n.id === otherId)
            // Only connect across different clusters
            if (node.data?.clusterId && otherNode?.data?.clusterId === node.data.clusterId) return
            const score = cosineSimilarity(vector, otherVector)
            if (score >= threshold) {
              dispatch({ type: 'ADD_SMART_EDGE', payload: { source: node.id, target: otherId, score } })
            }
          })
        } catch (err) {
          console.warn('Smart connect failed:', err.message)
        }
      }, DEBOUNCE_MS)
    })

    return () => {
      Object.values(timers.current).forEach(clearTimeout)
    }
  }, [nodes, dispatch, apiKey, threshold])
}
