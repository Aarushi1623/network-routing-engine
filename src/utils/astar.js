export function astar(nodes, edges, start, goal, blocked = new Set()) {
  if (start === goal) return [start];
  if (blocked.has(start) || blocked.has(goal)) return null;

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  // Only consider edges whose endpoints are both live
  const liveEdges = edges.filter(e => !blocked.has(e.from) && !blocked.has(e.to));

  // 1. Calculate the global minimum latency-to-pixel ratio.
  // This finds the "fastest" edge in the network relative to its visual length.
  let minRatio = Infinity;
  for (const edge of liveEdges) {
    const a = nodeMap[edge.from];
    const b = nodeMap[edge.to];
    if (a && b) {
      const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
      if (dist > 0) {
        const ratio = edge.latency / dist;
        if (ratio < minRatio) minRatio = ratio;
      }
    }
  }

  // Fallback if no valid edges exist yet (prevents Infinity/NaN issues)
  if (minRatio === Infinity) minRatio = 0;

  // 2. The Admissible Heuristic Function
  // Multiplies the remaining pixel distance by the "fastest" possible speed.
  // This guarantees we never overestimate the remaining latency.
  const heuristic = (currentId, goalId) => {
    const curr = nodeMap[currentId];
    const dest = nodeMap[goalId];
    const dist = Math.sqrt((curr.x - dest.x) ** 2 + (curr.y - dest.y) ** 2);
    return dist * minRatio;
  };

  // --- STANDARD A* INITIALIZATION ---
  const openSet = new Set([start]);
  const cameFrom = {};

  const gScore = {};
  const fScore = {};

  for (const node of nodes) {
    gScore[node.id] = Infinity;
    fScore[node.id] = Infinity;
  }

  gScore[start] = 0;
  fScore[start] = heuristic(start, goal);

  // --- STANDARD A* LOOP ---
  while (openSet.size > 0) {
    // Find the node in openSet with the lowest fScore
    let current = null;
    let lowestF = Infinity;
    for (const nodeId of openSet) {
      if (fScore[nodeId] < lowestF) {
        lowestF = fScore[nodeId];
        current = nodeId;
      }
    }

    if (current === goal) {
      const path = [current];
      while (cameFrom[current]) {
        current = cameFrom[current];
        path.unshift(current);
      }
      return path;
    }

    openSet.delete(current);

    const neighbors = liveEdges.filter(e => e.from === current || e.to === current);

    for (const edge of neighbors) {
      const neighborId = edge.from === current ? edge.to : edge.from;
      const tentativeGScore = gScore[current] + edge.latency;

      if (tentativeGScore < gScore[neighborId]) {
        cameFrom[neighborId] = current;
        gScore[neighborId] = tentativeGScore;
        fScore[neighborId] = tentativeGScore + heuristic(neighborId, goal);
        openSet.add(neighborId);
      }
    }
  }

  return null; // No path found
}

/** Total latency cost of a path */
export function pathCost(path, edges) {
  if (!path || path.length < 2) return 0;
  let total = 0;
  const edgeMap = {};
  for (const e of edges) {
    edgeMap[`${e.from}|${e.to}`] = e.latency;
    edgeMap[`${e.to}|${e.from}`] = e.latency;
  }
  for (let i = 0; i < path.length - 1; i++) {
    total += edgeMap[`${path[i]}|${path[i + 1]}`] ?? 0;
  }
  return total;
}
