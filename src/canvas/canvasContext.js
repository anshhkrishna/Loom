import { createContext, useContext } from 'react'

export const CanvasDispatchContext = createContext(null)

export function useCanvasDispatch() {
  return useContext(CanvasDispatchContext)
}
