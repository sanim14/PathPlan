import { Constraint, Graph, PathSegment, Route, RouterConfig, TimeBudget } from '../types';

// Exaggerated constraint presets for demo-visible route differences
const CONSTRAINT_PRESETS: Record<Constraint, RouterConfig> = {
  fastest:       { wDistance: 5.0, wCrowd: 0.2, wSafety: 0.2, wAccess: 0.2, wPop: 2.0 },
  accessibility: { wDistance: 1.0, wCrowd: 0.5, wSafety: 1.0, wAccess: 8.0, wPop: 1.0 },
  safety:        { wDistance: 0.5, wCrowd: 0.5, wSafety: 8.0, wAccess: 1.0, wPop: 1.0 },
  'low-crowd':   { wDistance: 0.5, wCrowd: 8.0, wSafety: 1.0, wAccess: 1.0, wPop: 1.0 },
};

const DEFAULT_CONFIG: RouterConfig = {
  wDistance: 1.0,
  wCrowd: 0.5,
  wSafety: 1.0,
  wAccess: 1.0,
  wPop: 1.0,
};

const TIME_BUDGET_WPOP: Record<TimeBudget, number> = {
  5: 3.0,
  10: 1.0,
  15: 0.3,
};

/**
 * Compute the edge cost for Dijkstra's algorithm.
 * Higher weights on crowd/safety/access push the router toward different paths.
 */
export function edgeCost(seg: PathSegment, cfg: RouterConfig): number {
  const w = seg.weights;
  // Base: distance cost
  // Penalties: crowd level (higher = worse), unsafe (lower safetyScore = worse), inaccessible
  // Bonus: popularity reduces cost slightly
  const crowdPenalty = cfg.wCrowd * w.crowdLevel * seg.distance;
  const safetyPenalty = cfg.wSafety * (1 - w.safetyScore) * seg.distance;
  const accessPenalty = cfg.wAccess * (1 - w.accessibilityScore) * seg.distance;
  const popularityBonus = cfg.wPop * Math.max(0, w.popularity) / 10;

  return (
    cfg.wDistance * seg.distance
    + crowdPenalty
    + safetyPenalty
    + accessPenalty
    - popularityBonus
  );
}

/**
 * Build a RouterConfig from active constraints and time budget.
 * Multiple constraints: average the weight presets.
 */
export function getRouterConfig(constraints: Constraint[], timeBudget: TimeBudget): RouterConfig {
  let cfg: RouterConfig;

  if (constraints.length === 0) {
    cfg = { ...DEFAULT_CONFIG };
  } else {
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

  cfg.wPop = TIME_BUDGET_WPOP[timeBudget];
  return cfg;
}

/**
 * Returns true if the segment is hard-blocked by active constraints.
 * Blocked segments get Infinity cost — router must find another path.
 */
export function isSegmentBlocked(seg: PathSegment, constraints: Constraint[]): boolean {
  // Accessibility: hard-block any segment with stairs
  if (constraints.includes('accessibility') && seg.tags.includes('stair')) {
    return true;
  }
  // Safety: hard-block poorly-lit or isolated segments
  if (constraints.includes('safety') &&
      (seg.tags.includes('poorly-lit') || seg.tags.includes('isolated'))) {
    return true;
  }
  return false;
}

/**
 * Compute edge cost with constraint-based hard blocking.
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
 * Falls back to unconstrained routing if hard constraints yield no path.
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

  // Fallback: drop accessibility constraint if it blocked all paths
  if (constraints.includes('accessibility')) {
    const fallback = _dijkstra(graph, startId, endId, constraints.filter((c) => c !== 'accessibility'), timeBudget);
    if (fallback) return { ...fallback, activeConstraints: constraints };
  }

  // Fallback: drop safety constraint if it blocked all paths
  if (constraints.includes('safety')) {
    const fallback = _dijkstra(graph, startId, endId, constraints.filter((c) => c !== 'safety'), timeBudget);
    if (fallback) return { ...fallback, activeConstraints: constraints };
  }

  return null;
}

interface DijkstraNode {
  id: string;
  cost: number;
  tiebreak: number;
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

  const dist = new Map<string, { cost: number; tiebreak: number }>();
  const prev = new Map<string, { nodeId: string; seg: PathSegment } | null>();

  for (const id of graph.nodes.keys()) {
    dist.set(id, { cost: Infinity, tiebreak: 0 });
    prev.set(id, null);
  }
  dist.set(startId, { cost: 0, tiebreak: 0 });

  const queue: DijkstraNode[] = [
    { id: startId, cost: 0, tiebreak: 0, prev: null, prevSeg: null },
  ];

  const visited = new Set<string>();

  while (queue.length > 0) {
    queue.sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      return b.tiebreak - a.tiebreak;
    });
    const current = queue.shift()!;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.id === endId) break;

    const neighbors = graph.edges.get(current.id) ?? [];
    for (const seg of neighbors) {
      if (visited.has(seg.to)) continue;

      const cost = edgeCostWithConstraints(seg, cfg, constraints);
      if (cost === Infinity) continue;

      const newCost = current.cost + cost;
      const segTiebreak = seg.weights.safetyScore + Math.max(0, seg.weights.popularity);
      const newTiebreak = current.tiebreak + segTiebreak;

      const existing = dist.get(seg.to);
      if (existing === undefined) continue;

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

  const endDist = dist.get(endId);
  if (!endDist || endDist.cost === Infinity) return null;

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
