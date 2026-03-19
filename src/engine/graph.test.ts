import { describe, it, expect } from 'vitest';
import { buildGraph, addShortcutEdge, haversineDistance } from './graph';
import { demoBuildings, demoShortcuts } from '../data/demo';
import { Building, Shortcut } from '../types';

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    const p = { lat: 30.2849, lng: -97.7341 };
    expect(haversineDistance(p, p)).toBe(0);
  });

  it('returns a positive distance for distinct points', () => {
    const a = { lat: 30.2821, lng: -97.7393 };
    const b = { lat: 30.2876, lng: -97.7363 };
    expect(haversineDistance(a, b)).toBeGreaterThan(0);
  });

  it('is symmetric', () => {
    const a = { lat: 30.2821, lng: -97.7393 };
    const b = { lat: 30.2876, lng: -97.7363 };
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 6);
  });
});

describe('buildGraph', () => {
  it('creates a node for every building entrance', () => {
    const graph = buildGraph(demoBuildings, []);
    const totalEntrances = demoBuildings.reduce((n, b) => n + b.entrances.length, 0);
    expect(graph.nodes.size).toBe(totalEntrances);
  });

  it('all entrance node ids match entrance ids', () => {
    const graph = buildGraph(demoBuildings, []);
    for (const building of demoBuildings) {
      for (const entrance of building.entrances) {
        expect(graph.nodes.has(entrance.id)).toBe(true);
        expect(graph.nodes.get(entrance.id)!.buildingId).toBe(building.id);
      }
    }
  });

  it('creates bidirectional edges between nearby buildings', () => {
    const graph = buildGraph(demoBuildings, []);
    // Every edge list entry should have a corresponding reverse edge
    for (const [fromId, segs] of graph.edges) {
      for (const seg of segs) {
        if (seg.shortcutId) continue; // skip shortcut edges
        const reverseEdges = graph.edges.get(seg.to) ?? [];
        const hasReverse = reverseEdges.some((s) => s.to === fromId && s.from === seg.to);
        expect(hasReverse).toBe(true);
      }
    }
  });

  it('does not connect entrances of the same building', () => {
    const graph = buildGraph(demoBuildings, []);
    for (const [, segs] of graph.edges) {
      for (const seg of segs) {
        if (seg.shortcutId) continue;
        const fromNode = graph.nodes.get(seg.from)!;
        const toNode = graph.nodes.get(seg.to)!;
        expect(fromNode.buildingId).not.toBe(toNode.buildingId);
      }
    }
  });

  it('all edge distances are positive', () => {
    const graph = buildGraph(demoBuildings, []);
    for (const [, segs] of graph.edges) {
      for (const seg of segs) {
        expect(seg.distance).toBeGreaterThan(0);
      }
    }
  });

  it('edge distance matches weights.distance', () => {
    const graph = buildGraph(demoBuildings, []);
    for (const [, segs] of graph.edges) {
      for (const seg of segs) {
        expect(seg.weights.distance).toBe(seg.distance);
      }
    }
  });

  it('adds shortcut nodes and edges from demo shortcuts', () => {
    const graph = buildGraph(demoBuildings, demoShortcuts);
    // Each shortcut with N coords produces N-1 edges and N nodes
    for (const sc of demoShortcuts) {
      const expectedEdges = sc.coordinates.length - 1;
      let count = 0;
      for (const [, segs] of graph.edges) {
        count += segs.filter((s) => s.shortcutId === sc.id).length;
      }
      expect(count).toBe(expectedEdges);
    }
  });

  it('shortcut edges carry the shortcut id', () => {
    const graph = buildGraph(demoBuildings, demoShortcuts);
    for (const [, segs] of graph.edges) {
      for (const seg of segs) {
        if (seg.shortcutId) {
          expect(typeof seg.shortcutId).toBe('string');
        }
      }
    }
  });
});

describe('addShortcutEdge', () => {
  it('adds N-1 edges for a shortcut with N coordinates', () => {
    const emptyGraph = buildGraph([], []);
    const shortcut: Shortcut = {
      id: 'test-sc',
      coordinates: [
        { lat: 30.28, lng: -97.74 },
        { lat: 30.281, lng: -97.739 },
        { lat: 30.282, lng: -97.738 },
      ],
      tags: ['indoor'],
      upvotes: 5,
      downvotes: 1,
      popularityScore: 4,
    };
    const graph = addShortcutEdge(emptyGraph, shortcut);
    let count = 0;
    for (const [, segs] of graph.edges) {
      count += segs.filter((s) => s.shortcutId === 'test-sc').length;
    }
    expect(count).toBe(2);
  });

  it('maps unsafe-at-night tag to poorly-lit and isolated segment tags', () => {
    const emptyGraph = buildGraph([], []);
    const shortcut: Shortcut = {
      id: 'unsafe-sc',
      coordinates: [
        { lat: 30.28, lng: -97.74 },
        { lat: 30.281, lng: -97.739 },
      ],
      tags: ['unsafe-at-night'],
      upvotes: 2,
      downvotes: 0,
      popularityScore: 2,
    };
    const graph = addShortcutEdge(emptyGraph, shortcut);
    const segs = graph.edges.get('unsafe-sc-wp-0') ?? [];
    expect(segs[0].tags).toContain('poorly-lit');
    expect(segs[0].tags).toContain('isolated');
  });

  it('maps crowded-between-classes to crowded segment tag', () => {
    const emptyGraph = buildGraph([], []);
    const shortcut: Shortcut = {
      id: 'crowd-sc',
      coordinates: [
        { lat: 30.28, lng: -97.74 },
        { lat: 30.281, lng: -97.739 },
      ],
      tags: ['crowded-between-classes'],
      upvotes: 10,
      downvotes: 0,
      popularityScore: 10,
    };
    const graph = addShortcutEdge(emptyGraph, shortcut);
    const segs = graph.edges.get('crowd-sc-wp-0') ?? [];
    expect(segs[0].tags).toContain('crowded');
  });

  it('does not mutate the original graph', () => {
    const original = buildGraph(demoBuildings, []);
    const originalNodeCount = original.nodes.size;
    const shortcut: Shortcut = {
      id: 'new-sc',
      coordinates: [
        { lat: 30.28, lng: -97.74 },
        { lat: 30.281, lng: -97.739 },
      ],
      tags: [],
      upvotes: 0,
      downvotes: 0,
      popularityScore: 0,
    };
    addShortcutEdge(original, shortcut);
    expect(original.nodes.size).toBe(originalNodeCount);
  });

  it('sets popularity from shortcut popularityScore', () => {
    const emptyGraph = buildGraph([], []);
    const shortcut: Shortcut = {
      id: 'pop-sc',
      coordinates: [
        { lat: 30.28, lng: -97.74 },
        { lat: 30.281, lng: -97.739 },
      ],
      tags: [],
      upvotes: 20,
      downvotes: 5,
      popularityScore: 15,
    };
    const graph = addShortcutEdge(emptyGraph, shortcut);
    const segs = graph.edges.get('pop-sc-wp-0') ?? [];
    expect(segs[0].weights.popularity).toBe(15);
  });
});

describe('buildGraph with minimal buildings', () => {
  const twoBuildings: Building[] = [
    {
      id: 'a',
      name: 'Building A',
      coordinates: { lat: 30.28, lng: -97.74 },
      entrances: [
        { id: 'a-main', coordinates: { lat: 30.28, lng: -97.74 }, tags: ['main', 'accessible'] },
      ],
    },
    {
      id: 'b',
      name: 'Building B',
      coordinates: { lat: 30.281, lng: -97.739 },
      entrances: [
        { id: 'b-main', coordinates: { lat: 30.281, lng: -97.739 }, tags: ['main'] },
      ],
    },
  ];

  it('connects two nearby buildings', () => {
    const graph = buildGraph(twoBuildings, []);
    expect(graph.edges.has('a-main')).toBe(true);
    expect(graph.edges.has('b-main')).toBe(true);
  });

  it('does not connect buildings farther than 500m', () => {
    const farBuildings: Building[] = [
      {
        id: 'near',
        name: 'Near',
        coordinates: { lat: 30.28, lng: -97.74 },
        entrances: [{ id: 'near-e', coordinates: { lat: 30.28, lng: -97.74 }, tags: ['main'] }],
      },
      {
        id: 'far',
        name: 'Far',
        coordinates: { lat: 30.30, lng: -97.74 }, // ~2.2 km away
        entrances: [{ id: 'far-e', coordinates: { lat: 30.30, lng: -97.74 }, tags: ['main'] }],
      },
    ];
    const graph = buildGraph(farBuildings, []);
    expect(graph.edges.size).toBe(0);
  });
});
