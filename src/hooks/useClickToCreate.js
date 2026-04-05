import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { generateId } from '../lib/idgen'

export function useClickToCreate(dispatch) {
  const { screenToFlowPosition } = useReactFlow()

  const handlePaneClick = useCallback((event) => {
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    const id = generateId()
    dispatch({ type: 'CREATE_NODE', payload: { id, position } })
  }, [screenToFlowPosition, dispatch])

  return handlePaneClick
}
