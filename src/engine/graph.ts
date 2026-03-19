import { Building, Graph, GraphNode, LatLng, PathSegment, SegmentTag, SegmentWeights, Shortcut } from '../types';

// Haversine formula — returns distance in meters between two lat/lng points
export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

// Map entrance tags to SegmentTags
function entranceTagsToSegmentTags(
  entranceTags: ('accessible' | 'main' | 'stair-free')[]
): SegmentTag[] {
  const result: SegmentTag[] = [];
  if (entranceTags.includes('main')) result.push('main-walkway');
  if (entranceTags.includes('accessible') || entranceTags.includes('stair-free')) result.push('ramp');
  return result;
}

// Map shortcut tags to SegmentTags
function shortcutTagsToSegmentTags(
  tags: Shortcut['tags']
): SegmentTag[] {
  const result: SegmentTag[] = [];
  for (const tag of tags) {
    switch (tag) {
      case 'indoor':
        result.push('indoor');
        break;
      case 'unsafe-at-night':
        result.push('poorly-lit', 'isolated');
        break;
      case 'crowded-between-classes':
        result.push('crowded');
        break;
      // 'hidden-shortcut' has no direct SegmentTag equivalent — skip
    }
  }
  return result;
}

// Derive SegmentWeights from tags and optional shortcut popularity
function weightsFromTags(tags: SegmentTag[], popularity = 0): SegmentWeights {
  const crowdLevel = tags.includes('crowded') ? 0.8 : 0.3;
  const safetyScore =
    tags.includes('poorly-lit') || tags.includes('isolated') ? 0.3 : 0.8;
  const accessibilityScore =
    tags.includes('stair') ? 0.1 : tags.includes('ramp') || tags.includes('elevator') ? 1.0 : 0.7;
  return {
    distance: 0, // will be set to actual distance after creation
    crowdLevel,
    safetyScore,
    accessibilityScore,
    popularity,
  };
}

function addEdge(edges: Map<string, PathSegment[]>, segment: PathSegment): void {
  const list = edges.get(segment.from) ?? [];
  list.push(segment);
  edges.set(segment.from, list);
}

/**
 * Build a graph from campus buildings and community shortcuts.
 *
 * Nodes  — one per building entrance.
 * Edges  — bidirectional segments between entrances of nearby buildings (≤500 m)
 *          plus one directed segment per consecutive coordinate pair in each shortcut.
 */
export function buildGraph(buildings: Building[], shortcuts: Shortcut[]): Graph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, PathSegment[]>();

  // 1. Create nodes from building entrances
  for (const building of buildings) {
    for (const entrance of building.entrances) {
      const node: GraphNode = {
        id: entrance.id,
        coordinates: entrance.coordinates,
        buildingId: building.id,
      };
      nodes.set(entrance.id, node);
    }
  }

  // 2. Connect entrances of nearby buildings (within 500 m) — bidirectional
  const allEntrances = buildings.flatMap((b) =>
    b.entrances.map((e) => ({ entrance: e, building: b }))
  );

  for (let i = 0; i < allEntrances.length; i++) {
    for (let j = i + 1; j < allEntrances.length; j++) {
      const { entrance: eA, building: bA } = allEntrances[i];
      const { entrance: eB, building: bB } = allEntrances[j];

      // Skip entrances of the same building
      if (bA.id === bB.id) continue;

      const dist = haversineDistance(eA.coordinates, eB.coordinates);
      if (dist > 500) continue;

      const combinedTags = Array.from(
        new Set([
          ...entranceTagsToSegmentTags(eA.tags),
          ...entranceTagsToSegmentTags(eB.tags),
        ])
      );

      const weights = weightsFromTags(combinedTags);
      weights.distance = dist;

      const segAB: PathSegment = {
        id: `seg-${eA.id}-${eB.id}`,
        from: eA.id,
        to: eB.id,
        distance: dist,
        tags: combinedTags,
        weights,
      };

      const segBA: PathSegment = {
        id: `seg-${eB.id}-${eA.id}`,
        from: eB.id,
        to: eA.id,
        distance: dist,
        tags: combinedTags,
        weights: { ...weights },
      };

      addEdge(edges, segAB);
      addEdge(edges, segBA);
    }
  }

  // 3. Add shortcut edges
  let graph: Graph = { nodes, edges };
  for (const shortcut of shortcuts) {
    graph = addShortcutEdge(graph, shortcut);
  }

  return graph;
}

/**
 * Incrementally add edges (and nodes) for a new shortcut.
 * Returns a new Graph with the shortcut's coordinate pairs wired in.
 */
export function addShortcutEdge(graph: Graph, shortcut: Shortcut): Graph {
  const nodes = new Map(graph.nodes);
  const edges = new Map(
    Array.from(graph.edges.entries()).map(([k, v]) => [k, [...v]])
  );

  const segTags = shortcutTagsToSegmentTags(shortcut.tags);
  const popularity = shortcut.popularityScore;

  for (let i = 0; i < shortcut.coordinates.length - 1; i++) {
    const fromCoord = shortcut.coordinates[i];
    const toCoord = shortcut.coordinates[i + 1];

    const fromId = `${shortcut.id}-wp-${i}`;
    const toId = `${shortcut.id}-wp-${i + 1}`;

    // Ensure nodes exist for each waypoint
    if (!nodes.has(fromId)) {
      nodes.set(fromId, { id: fromId, coordinates: fromCoord });
    }
    if (!nodes.has(toId)) {
      nodes.set(toId, { id: toId, coordinates: toCoord });
    }

    const dist = haversineDistance(fromCoord, toCoord);
    const weights = weightsFromTags(segTags, popularity);
    weights.distance = dist;

    const segment: PathSegment = {
      id: `${shortcut.id}-seg-${i}`,
      from: fromId,
      to: toId,
      distance: dist,
      tags: segTags,
      weights,
      shortcutId: shortcut.id,
    };

    addEdge(edges, segment);
  }

  return { nodes, edges };
}
