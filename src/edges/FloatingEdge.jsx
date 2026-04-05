import { getBezierPath } from '@xyflow/react'
import './FloatingEdge.css'

const THRESHOLD = 0.72
const MAX_SCORE = 0.94

function scoreToStyle(score, selected) {
  if (selected) return { opacity: 0.95, strokeWidth: 3.0 }
  const t = Math.min(Math.max((score - THRESHOLD) / (MAX_SCORE - THRESHOLD), 0), 1)
  return {
    opacity: 0.08 + t * 0.82,
    strokeWidth: 0.8 + t * 2.4,
  }
}

export function FloatingEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
  markerStart,
}) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.3,
  })

  const score = data?.score ?? THRESHOLD
  const { opacity, strokeWidth } = scoreToStyle(score, selected)

  return (
    <g className="floating-edge">
      {/* Wide invisible hit target */}
      <path d={edgePath} fill="none" strokeWidth={20} stroke="transparent" />
      {/* Visible animated edge */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        pathLength="1"
        stroke="var(--edge-color)"
        strokeWidth={strokeWidth}
        opacity={opacity}
        className="floating-edge__path"
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{ transition: 'opacity 400ms ease, stroke-width 400ms ease' }}
      />
    </g>
  )
}
