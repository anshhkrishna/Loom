import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { generateId } from '../lib/idgen'

export function useClickToCreate(dispatch, activeClusterId) {
  const { screenToFlowPosition } = useReactFlow()

  return useCallback((event) => {
    if (!activeClusterId) return
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    const id = generateId()
    dispatch({ type: 'CREATE_NODE', payload: { id, position, clusterId: activeClusterId } })
  }, [screenToFlowPosition, dispatch, activeClusterId])
}
