import { createContext, useContext } from 'react'

export const CanvasDispatchContext = createContext(null)
export const CanvasStateContext = createContext(null)

export function useCanvasDispatch() {
  return useContext(CanvasDispatchContext)
}

export function useCanvasState() {
  return useContext(CanvasStateContext)
}
