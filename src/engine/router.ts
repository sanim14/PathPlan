import { Constraint, Graph, PathSegment, Route, RouterConfig, TimeBudget } from '../types';

// Constraint weight presets
const CONSTRAINT_PRESETS: Record<Constraint, RouterConfig> = {
  fastest:       { wDistance: 2.0, wCrowd: 0.5, wSafety: 0.5, wAccess: 0.5, wPop: 1.0 },
  accessibility: { wDistance: 1.0, wCrowd: 0.5, wSafety: 1.0, wAccess: 3.0, wPop: 1.0 },
  safety:        { wDistance: 1.0, wCrowd: 0.5, wSafety: 3.0, wAccess: 1.0, wPop: 1.0 },
  'low-crowd':   { wDistance: 1.0, wCrowd: 3.0, wSafety: 1.0, wAccess: 1.0, wPop: 1.0 },
};

const DEFAULT_CONFIG: RouterConfig = {
  wDistance: 1.0,
  wCrowd: 0.5,
  wSafety: 1.0,
  wAccess: 1.0,
  wPop: 1.0,
};

const TIME_BUDGET_WPOP: Record<TimeBudget, number> = {
  5: 2.0,
  10: 1.0,
  15: 0.5,
};

/**
 * Compute the edge cost for Dijkstra's algorithm.
 * Returns Infinity for segments that violate active constraints.
 */
export function edgeCost(seg: PathSegment, cfg: RouterConfig): number {
  const w = seg.weights;
  return (
    cfg.wDistance * seg.distance
    + cfg.wCrowd   * w.crowdLevel
    - cfg.wSafety  * w.safetyScore
    - cfg.wAccess  * w.accessibilityScore
    - cfg.wPop     * Math.max(0, w.popularity) / 10
  );
}

/**
 * Build a RouterConfig from active constraints and time budget.
 * Multiple constraints: average the weight presets.
 * Time budget overrides wPop after averaging.
 */
export function getRouterConfig(constraints: Constraint[], timeBudget: TimeBudget): RouterConfig {
  let cfg: RouterConfig;

  if (constraints.length === 0) {
    cfg = { ...DEFAULT_CONFIG };
  } else {
    // Average the presets for all active constraints
    const keys: (keyof RouterConfig)[] = ['wDistance', 'wCrowd', 'wSafety', 'wAccess', 'wPop'];
    const sum = { wDistance: 0, wCrowd: 0, wSafety: 0, wAccess: 0, wPop: 0 };
    for (const constraint of constraints) {
      const preset = CONSTRAINT_PRESETS[constraint];
      for (const key of keys) {
        sum[key] += preset[key];
      }
    }
    cfg = {
      wDistance: sum.wDistance / constraints.length,
      wCrowd:    sum.wCrowd    / constraints.length,
      wSafety:   sum.wSafety   / constraints.length,
      wAccess:   sum.wAccess   / constraints.length,
      wPop:      sum.wPop      / constraints.length,
    };
  }

  // Time budget adjusts wPop
  cfg.wPop = TIME_BUDGET_WPOP[timeBudget];

  return cfg;
}

/**
 * Returns true if the segment should be treated as infinite cost
 * given the active constraints.
 */
export function isSegmentBlocked(seg: PathSegment, constraints: Constraint[]): boolean {
  if (constraints.includes('accessibility') && seg.tags.includes('stair')) {
    return true;
  }
  if (constraints.includes('safety') &&
      (seg.tags.includes('poorly-lit') || seg.tags.includes('isolated'))) {
    return true;
  }
  return false;
}

/**
 * Compute edge cost with constraint-based blocking.
 * Returns Infinity for blocked segments.
 */
export function edgeCostWithConstraints(
  seg: PathSegment,
  cfg: RouterConfig,
  constraints: Constraint[]
): number {
  if (isSegmentBlocked(seg, constraints)) return Infinity;
  return edgeCost(seg, cfg);
}

/**
 * Dijkstra's algorithm over the graph.
 * Returns the best Route from startId to endId, or null if no path exists.
 * When two routes have equal total weight, prefers higher (safetyScore + popularity) tiebreak.
 * Falls back to unconstrained routing if accessibility/safety constraints yield no path.
 */
export function computeRoute(
  graph: Graph,
  startId: string,
  endId: string,
  constraints: Constraint[],
  timeBudget: TimeBudget
): Route | null {
  const result = _dijkstra(graph, startId, endId, constraints, timeBudget);

  if (result !== null) return result;

  // Fallback: if accessibility constraint blocked all paths, retry without it
  if (constraints.includes('accessibility')) {
    const fallbackConstraints = constraints.filter((c) => c !== 'accessibility');
    const fallback = _dijkstra(graph, startId, endId, fallbackConstraints, timeBudget);
    if (fallback !== null) {
      return { ...fallback, activeConstraints: constraints };
    }
  }

  // Fallback: if safety constraint blocked all paths, retry without it
  if (constraints.includes('safety')) {
    const fallbackConstraints = constraints.filter((c) => c !== 'safety');
    const fallback = _dijkstra(graph, startId, endId, fallbackConstraints, timeBudget);
    if (fallback !== null) {
      return { ...fallback, activeConstraints: constraints };
    }
  }

  return null;
}

interface DijkstraNode {
  id: string;
  cost: number;
  tiebreak: number; // higher is better (safetyScore + popularity)
  prev: string | null;
  prevSeg: PathSegment | null;
}

function _dijkstra(
  graph: Graph,
  startId: string,
  endId: string,
  constraints: Constraint[],
  timeBudget: TimeBudget
): Route | null {
  if (!graph.nodes.has(startId) || !graph.nodes.has(endId)) return null;

  const cfg = getRouterConfig(constraints, timeBudget);

  // dist[id] = { cost, tiebreak }
  const dist = new Map<string, { cost: number; tiebreak: number }>();
  const prev = new Map<string, { nodeId: string; seg: PathSegment } | null>();

  for (const id of graph.nodes.keys()) {
    dist.set(id, { cost: Infinity, tiebreak: 0 });
    prev.set(id, null);
  }
  dist.set(startId, { cost: 0, tiebreak: 0 });

  // Simple priority queue as sorted array (small graphs)
  const queue: DijkstraNode[] = [
    { id: startId, cost: 0, tiebreak: 0, prev: null, prevSeg: null },
  ];

  const visited = new Set<string>();

  while (queue.length > 0) {
    // Pop node with lowest cost (ties broken by higher tiebreak)
    queue.sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      return b.tiebreak - a.tiebreak; // prefer higher tiebreak
    });
    const current = queue.shift()!;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.id === endId) break;

    const neighbors = graph.edges.get(current.id) ?? [];
    for (const seg of neighbors) {
      if (visited.has(seg.to)) continue;

      const edgeCostVal = edgeCostWithConstraints(seg, cfg, constraints);
      if (edgeCostVal === Infinity) continue;

      const newCost = current.cost + edgeCostVal;
      const segTiebreak = seg.weights.safetyScore + Math.max(0, seg.weights.popularity);
      const newTiebreak = current.tiebreak + segTiebreak;

      const existing = dist.get(seg.to);
      if (existing === undefined) continue; // node not in graph

      const isBetter =
        newCost < existing.cost ||
        (newCost === existing.cost && newTiebreak > existing.tiebreak);

      if (isBetter) {
        dist.set(seg.to, { cost: newCost, tiebreak: newTiebreak });
        prev.set(seg.to, { nodeId: current.id, seg });
        queue.push({ id: seg.to, cost: newCost, tiebreak: newTiebreak, prev: current.id, prevSeg: seg });
      }
    }
  }

  // No path found
  const endDist = dist.get(endId);
  if (!endDist || endDist.cost === Infinity) return null;

  // Reconstruct path
  const segments: PathSegment[] = [];
  let cursor: string | null = endId;
  while (cursor !== null && cursor !== startId) {
    const entry = prev.get(cursor);
    if (!entry) break;
    segments.unshift(entry.seg);
    cursor = entry.nodeId;
  }

  const totalDistance = segments.reduce((sum, s) => sum + s.distance, 0);
  const estimatedTime = totalDistance / 1.4 / 60;

  return {
    segments,
    totalDistance,
    estimatedTime,
    explanation: '',
    activeConstraints: constraints,
  };
}
