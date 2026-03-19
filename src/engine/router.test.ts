import { describe, it, expect } from 'vitest';
import { buildGraph } from './graph';
import { computeRoute } from './router';
import { Building, Graph, PathSegment } from '../types';

// Minimal two-building graph for most tests
const twoBuildings: Building[] = [
  {
    id: 'a',
    name: 'Building A',
    coordinates: { lat: 30.28, lng: -97.74 },
    entrances: [
      { id: 'a-main', coordinates: { lat: 30.28, lng: -97.74 }, tags: ['main'] },
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

const simpleGraph = buildGraph(twoBuildings, []);

describe('computeRoute', () => {
  it('returns null for empty graph', () => {
    const emptyGraph: Graph = { nodes: new Map(), edges: new Map() };
    expect(computeRoute(emptyGraph, 'x', 'y', [], 10)).toBeNull();
  });

  it('returns null when no path exists between disconnected nodes', () => {
    // Two buildings far apart (>500m) won't be connected
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
        coordinates: { lat: 30.30, lng: -97.74 },
        entrances: [{ id: 'far-e', coordinates: { lat: 30.30, lng: -97.74 }, tags: ['main'] }],
      },
    ];
    const disconnectedGraph = buildGraph(farBuildings, []);
    expect(computeRoute(disconnectedGraph, 'near-e', 'far-e', [], 10)).toBeNull();
  });

  it('returns a route between two connected nodes', () => {
    const route = computeRoute(simpleGraph, 'a-main', 'b-main', [], 10);
    expect(route).not.toBeNull();
    expect(route!.segments.length).toBeGreaterThan(0);
  });

  it('route segments form a valid path from start to end', () => {
    const route = computeRoute(simpleGraph, 'a-main', 'b-main', [], 10);
    expect(route).not.toBeNull();
    expect(route!.segments[0].from).toBe('a-main');
    expect(route!.segments[route!.segments.length - 1].to).toBe('b-main');
  });

  it('totalDistance equals sum of segment distances', () => {
    const route = computeRoute(simpleGraph, 'a-main', 'b-main', [], 10);
    expect(route).not.toBeNull();
    const sum = route!.segments.reduce((acc, s) => acc + s.distance, 0);
    expect(route!.totalDistance).toBeCloseTo(sum, 6);
  });

  it('estimatedTime = totalDistance / 1.4 / 60', () => {
    const route = computeRoute(simpleGraph, 'a-main', 'b-main', [], 10);
    expect(route).not.toBeNull();
    expect(route!.estimatedTime).toBeCloseTo(route!.totalDistance / 1.4 / 60, 6);
  });

  it('explanation is empty string (filled by Task 4)', () => {
    const route = computeRoute(simpleGraph, 'a-main', 'b-main', [], 10);
    expect(route!.explanation).toBe('');
  });

  it('activeConstraints matches the passed constraints', () => {
    const route = computeRoute(simpleGraph, 'a-main', 'b-main', ['safety'], 10);
    expect(route!.activeConstraints).toEqual(['safety']);
  });

  it('returns null for unknown startId', () => {
    expect(computeRoute(simpleGraph, 'unknown', 'b-main', [], 10)).toBeNull();
  });

  it('returns null for unknown endId', () => {
    expect(computeRoute(simpleGraph, 'a-main', 'unknown', [], 10)).toBeNull();
  });

  it('falls back when accessibility constraint blocks all paths', () => {
    // Build a graph where the only edge has a stair tag
    const nodes = new Map([
      ['x', { id: 'x', coordinates: { lat: 30.28, lng: -97.74 } }],
      ['y', { id: 'y', coordinates: { lat: 30.281, lng: -97.739 } }],
    ]);
    const seg: PathSegment = {
      id: 'seg-x-y',
      from: 'x',
      to: 'y',
      distance: 100,
      tags: ['stair'],
      weights: { distance: 100, crowdLevel: 0.3, safetyScore: 0.8, accessibilityScore: 0.1, popularity: 0 },
    };
    const edges = new Map([['x', [seg]]]);
    const stairedGraph: Graph = { nodes, edges };

    // With accessibility constraint, stair is blocked → fallback without accessibility
    const route = computeRoute(stairedGraph, 'x', 'y', ['accessibility'], 10);
    expect(route).not.toBeNull();
    // activeConstraints still reflects original constraints
    expect(route!.activeConstraints).toContain('accessibility');
  });

  it('falls back when safety constraint blocks all paths', () => {
    const nodes = new Map([
      ['x', { id: 'x', coordinates: { lat: 30.28, lng: -97.74 } }],
      ['y', { id: 'y', coordinates: { lat: 30.281, lng: -97.739 } }],
    ]);
    const seg: PathSegment = {
      id: 'seg-x-y',
      from: 'x',
      to: 'y',
      distance: 100,
      tags: ['poorly-lit'],
      weights: { distance: 100, crowdLevel: 0.3, safetyScore: 0.3, accessibilityScore: 0.7, popularity: 0 },
    };
    const edges = new Map([['x', [seg]]]);
    const unsafeGraph: Graph = { nodes, edges };

    const route = computeRoute(unsafeGraph, 'x', 'y', ['safety'], 10);
    expect(route).not.toBeNull();
    expect(route!.activeConstraints).toContain('safety');
  });

  it('prefers route with higher safetyScore + popularity on equal weight', () => {
    // Build a graph with two parallel paths: A→C→B and A→D→B
    // Both paths have the same total edge cost but different tiebreak scores
    const nodes = new Map([
      ['A', { id: 'A', coordinates: { lat: 30.28, lng: -97.74 } }],
      ['C', { id: 'C', coordinates: { lat: 30.2805, lng: -97.7395 } }],
      ['D', { id: 'D', coordinates: { lat: 30.2805, lng: -97.7385 } }],
      ['B', { id: 'B', coordinates: { lat: 30.281, lng: -97.739 } }],
    ]);

    // Use identical distances so edge costs are equal (same wDistance * distance)
    // Differentiate only by safetyScore + popularity (tiebreak)
    const makeSegment = (id: string, from: string, to: string, safety: number, pop: number): PathSegment => ({
      id,
      from,
      to,
      distance: 50,
      tags: [],
      weights: { distance: 50, crowdLevel: 0.3, safetyScore: safety, accessibilityScore: 0.7, popularity: pop },
    });

    // Path via C: low tiebreak (safety=0.3, pop=0)
    const segAC = makeSegment('AC', 'A', 'C', 0.3, 0);
    const segCB = makeSegment('CB', 'C', 'B', 0.3, 0);

    // Path via D: high tiebreak (safety=0.9, pop=10)
    const segAD = makeSegment('AD', 'A', 'D', 0.9, 10);
    const segDB = makeSegment('DB', 'D', 'B', 0.9, 10);

    const edges = new Map([
      ['A', [segAC, segAD]],
      ['C', [segCB]],
      ['D', [segDB]],
    ]);
    const tiebreakGraph: Graph = { nodes, edges };

    const route = computeRoute(tiebreakGraph, 'A', 'B', [], 10);
    expect(route).not.toBeNull();
    // Should prefer path via D (higher tiebreak)
    const nodeIds = ['A', ...route!.segments.map((s) => s.to)];
    expect(nodeIds).toContain('D');
    expect(nodeIds).not.toContain('C');
  });
});
