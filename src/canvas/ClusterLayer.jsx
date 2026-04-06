import { useViewport } from '@xyflow/react'
import { CLUSTER_COLORS } from './canvasReducer'
import './ClusterLayer.css'

function getClusterBBox(clusterNodes) {
  if (clusterNodes.length === 0) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of clusterNodes) {
    const w = n.measured?.width ?? 180
    const h = n.measured?.height ?? 44
    minX = Math.min(minX, n.position.x)
    minY = Math.min(minY, n.position.y)
    maxX = Math.max(maxX, n.position.x + w)
    maxY = Math.max(maxY, n.position.y + h)
  }
  const pad = 56
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
    centerX: (minX + maxX) / 2,
    topY: minY - pad,
  }
}

export function ClusterLayer({ clusters, nodes, onClose, onActivate, activeClusterId }) {
  const { x: vpX, y: vpY, zoom } = useViewport()

  const openClusters = clusters.filter(c => c.isOpen)
  if (openClusters.length === 0) return null

  return (
    <>
      {/* SVG blob backgrounds */}
      <svg className="cluster-layer__svg">
        <defs>
          <filter id="cluster-blur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
        <g transform={`translate(${vpX}, ${vpY}) scale(${zoom})`}>
          {openClusters.map(cluster => {
            const clusterNodes = nodes.filter(n => n.data?.clusterId === cluster.id && !n.hidden)
            if (clusterNodes.length < 1) return null
            const bbox = getClusterBBox(clusterNodes)
            if (!bbox) return null
            const color = CLUSTER_COLORS[cluster.colorIdx % CLUSTER_COLORS.length]
            const isActive = cluster.id === activeClusterId

            return (
              <rect
                key={cluster.id}
                x={bbox.x}
                y={bbox.y}
                width={bbox.width}
                height={bbox.height}
                rx={24}
                fill={color.bg}
                opacity={isActive ? 1.4 : 0.85}
                filter="url(#cluster-blur)"
              />
            )
          })}
        </g>
      </svg>

      {/* Floating HTML headers */}
      <div className="cluster-layer__headers">
        {openClusters.map(cluster => {
          const clusterNodes = nodes.filter(n => n.data?.clusterId === cluster.id && !n.hidden)
          if (clusterNodes.length < 1) return null
          const bbox = getClusterBBox(clusterNodes)
          if (!bbox) return null
          const color = CLUSTER_COLORS[cluster.colorIdx % CLUSTER_COLORS.length]
          const isActive = cluster.id === activeClusterId

          const screenX = bbox.centerX * zoom + vpX
          const screenY = bbox.topY * zoom + vpY - 8

          return (
            <div
              key={cluster.id}
              className={`cluster-header ${isActive ? 'cluster-header--active' : ''}`}
              style={{
                left: screenX,
                top: screenY,
                '--cluster-accent': color.accent,
              }}
            >
              <div className="cluster-header__dot" />
              <span
                className="cluster-header__name"
                onClick={() => onActivate(cluster.id)}
                title="click to make active"
              >
                {cluster.name}
              </span>
              <button
                className="cluster-header__close"
                onClick={() => onClose(cluster.id)}
                title="close cluster"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
