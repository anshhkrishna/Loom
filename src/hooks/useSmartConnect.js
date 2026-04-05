import { useEffect, useRef } from 'react'
import { fetchEmbedding, cosineSimilarity } from '../lib/embeddings'

const SIMILARITY_THRESHOLD = 0.72
const DEBOUNCE_MS = 1000

export function useSmartConnect(nodes, embeddings, dispatch, apiKey) {
  const timers = useRef({})
  const embeddingsRef = useRef(embeddings)

  useEffect(() => {
    embeddingsRef.current = embeddings
  }, [embeddings])

  useEffect(() => {
    if (!apiKey) return

    nodes.forEach(node => {
      if (node.data.isEditing || !node.data.label) return
      if (embeddingsRef.current.has(node.id)) return

      clearTimeout(timers.current[node.id])
      timers.current[node.id] = setTimeout(async () => {
        try {
          const vector = await fetchEmbedding(node.data.label, apiKey)
          if (!vector) return

          dispatch({ type: 'SET_EMBEDDING', payload: { id: node.id, vector } })

          embeddingsRef.current.forEach((otherVector, otherId) => {
            if (otherId === node.id) return
            const score = cosineSimilarity(vector, otherVector)
            if (score >= SIMILARITY_THRESHOLD) {
              dispatch({
                type: 'ADD_SMART_EDGE',
                payload: { source: node.id, target: otherId, score },
              })
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
  }, [nodes, dispatch, apiKey])
}
