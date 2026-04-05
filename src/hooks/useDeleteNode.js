import { useEffect } from 'react'

export function useDeleteNode(nodes, dispatch) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return

      const selectedNodes = nodes.filter(n => n.selected && !n.data.isExiting)
      selectedNodes.forEach(node => {
        dispatch({ type: 'BEGIN_DELETE', payload: { id: node.id } })
        setTimeout(() => {
          dispatch({ type: 'CONFIRM_DELETE', payload: { id: node.id } })
        }, 160)
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nodes, dispatch])
}
