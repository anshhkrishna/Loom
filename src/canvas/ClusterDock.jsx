import { CLUSTER_COLORS } from './canvasReducer'
import './ClusterDock.css'

export function ClusterDock({ clusters, nodes, onOpen }) {
  const closed = clusters.filter(c => !c.isOpen)
  if (closed.length === 0) return null

  return (
    <div className="cluster-dock">
      {closed.map(c => {
        const color = CLUSTER_COLORS[c.colorIdx % CLUSTER_COLORS.length]
        const count = nodes.filter(n => n.data?.clusterId === c.id).length
        return (
          <button
            key={c.id}
            className="cluster-dock__item"
            style={{ '--cluster-accent': color.accent }}
            onClick={() => onOpen(c.id)}
            title={`open ${c.name}`}
          >
            <span className="cluster-dock__dot" />
            <span className="cluster-dock__name">{c.name}</span>
            <span className="cluster-dock__count">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
