function buildChainOrder(clusterNodes, chainEdges) {
  if (clusterNodes.length === 0) return clusterNodes
  const nodeIds = new Set(clusterNodes.map(n => n.id))
  const inDegree = {}
  for (const n of clusterNodes) inDegree[n.id] = 0
  for (const e of chainEdges) {
    if (nodeIds.has(e.target)) inDegree[e.target] = (inDegree[e.target] || 0) + 1
  }
  const adj = {}
  for (const e of chainEdges) {
    if (nodeIds.has(e.source) && nodeIds.has(e.target)) adj[e.source] = e.target
  }
  const starts = clusterNodes.filter(n => inDegree[n.id] === 0)
  if (starts.length === 0) return clusterNodes

  const result = []
  let current = starts[0].id
  const seen = new Set()
  while (current && !seen.has(current)) {
    const node = clusterNodes.find(n => n.id === current)
    if (node) result.push(node)
    seen.add(current)
    current = adj[current]
  }
  // Append any nodes not reached by chain (branches etc.)
  for (const n of clusterNodes) {
    if (!seen.has(n.id)) result.push(n)
  }
  return result
}

/**
 * Build numbered node context for AI prompts.
 * Returns nodeIndex (for citation lookup) and formatted prompt lines.
 */
export function buildCanvasContext(clusters, nodes, edges) {
  const chainEdges = edges.filter(e => e.data?.isChain)
  const nodeIndex = [] // { num, nodeId, clusterId, clusterName, label }
  let counter = 1

  const clusterSections = []

  for (const cluster of clusters) {
    const clusterNodes = nodes.filter(
      n => n.data?.clusterId === cluster.id && !n.hidden && n.data?.label?.trim()
    )
    if (clusterNodes.length === 0) continue

    const ordered = buildChainOrder(clusterNodes, chainEdges)
    const lines = []
    for (const node of ordered) {
      nodeIndex.push({ num: counter, nodeId: node.id, clusterId: cluster.id, clusterName: cluster.name, label: node.data.label })
      lines.push(`[${counter}] "${node.data.label}"`)
      counter++
    }
    clusterSections.push(`cluster "${cluster.name}":\n${lines.join('\n')}`)
  }

  // Cross-cluster semantic connections
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const crossEdges = []
  for (const edge of edges) {
    if (edge.data?.isChain) continue
    const nodeA = nodeMap.get(edge.source)
    const nodeB = nodeMap.get(edge.target)
    if (!nodeA || !nodeB) continue
    if (nodeA.data?.clusterId === nodeB.data?.clusterId) continue
    const entryA = nodeIndex.find(e => e.nodeId === nodeA.id)
    const entryB = nodeIndex.find(e => e.nodeId === nodeB.id)
    if (entryA && entryB) {
      crossEdges.push(`[${entryA.num}] (${entryA.clusterName}) ↔ [${entryB.num}] (${entryB.clusterName})`)
    }
  }

  return { clusterSections, crossEdges, nodeIndex }
}

/**
 * Build context focused on a single cluster.
 */
export function buildSingleClusterContext(clusterId, clusterName, nodes, edges) {
  const chainEdges = edges.filter(e => e.data?.isChain)
  const clusterNodes = nodes.filter(n => n.data?.clusterId === clusterId && n.data?.label?.trim())
  const ordered = buildChainOrder(clusterNodes, chainEdges)
  const nodeIndex = ordered.map((n, i) => ({
    num: i + 1,
    nodeId: n.id,
    clusterId,
    clusterName,
    label: n.data.label,
  }))
  const lines = nodeIndex.map(e => `[${e.num}] "${e.label}"`)
  return {
    section: `cluster "${clusterName}":\n${lines.join('\n')}`,
    nodeIndex,
  }
}
