import { create } from 'zustand';
import { Building, Constraint, Graph, Route, Shortcut, TimeBudget } from '../types';
import { buildGraph, addShortcutEdge } from '../engine/graph';
import { computeRoute } from '../engine/router';
import { generateExplanation } from '../engine/explanation';
import { demoBuildings, demoShortcuts } from '../data/demo';

interface LatLng { lat: number; lng: number }

interface AppState {
  graph: Graph;
  shortcuts: Shortcut[];
  activeRoute: Route | null;
  constraints: Constraint[];
  timeBudget: TimeBudget;
  communityLayerEnabled: boolean;
  sessionVotes: Set<string>;
  startLocation: Building | null;
  endLocation: Building | null;
  // UI state
  activeShortcut: Shortcut | null;
  isAddingShortcut: boolean;
  routeFallback: 'accessibility' | 'safety' | null;
  // Waypoints for map-driven shortcut drawing
  waypoints: LatLng[];

  // Actions
  setConstraint: (constraint: Constraint, active: boolean) => void;
  setTimeBudget: (budget: TimeBudget) => void;
  setStartLocation: (building: Building | null) => void;
  setEndLocation: (building: Building | null) => void;
  setActiveRoute: (route: Route | null) => void;
  toggleCommunityLayer: () => void;
  addShortcut: (shortcut: Shortcut) => void;
  voteOnShortcut: (id: string, direction: 'up' | 'down') => void;
  seedDemoData: () => void;
  setActiveShortcut: (shortcut: Shortcut | null) => void;
  setIsAddingShortcut: (value: boolean) => void;
  addWaypoint: (latlng: LatLng) => void;
  undoLastWaypoint: () => void;
  clearWaypoints: () => void;
}

/** Find the first entrance node ID for a building */
function getEntranceId(building: Building): string {
  return building.entrances[0].id;
}

/** Compute route between two buildings and attach explanation */
function computeRouteForBuildings(
  graph: Graph,
  start: Building,
  end: Building,
  constraints: Constraint[],
  timeBudget: TimeBudget
): Route | null {
  const startId = getEntranceId(start);
  const endId = getEntranceId(end);
  const route = computeRoute(graph, startId, endId, constraints, timeBudget);
  if (route) {
    route.explanation = generateExplanation(route);
  }
  return route;
}

export const useStore = create<AppState>((set, get) => ({
  graph: { nodes: new Map(), edges: new Map() },
  shortcuts: [],
  activeRoute: null,
  constraints: [],
  timeBudget: 10,
  communityLayerEnabled: false,
  sessionVotes: new Set(),
  startLocation: null,
  endLocation: null,
  activeShortcut: null,
  isAddingShortcut: false,
  routeFallback: null,
  waypoints: [],

  setConstraint: (constraint, active) => {
    const { constraints, startLocation, endLocation, graph, timeBudget } = get();
    const updated = active
      ? constraints.includes(constraint) ? constraints : [...constraints, constraint]
      : constraints.filter((c) => c !== constraint);

    let activeRoute: Route | null = get().activeRoute;
    if (startLocation && endLocation) {
      activeRoute = computeRouteForBuildings(graph, startLocation, endLocation, updated, timeBudget);
    }

    set({ constraints: updated, activeRoute });
  },

  setTimeBudget: (budget) => {
    const { startLocation, endLocation, graph, constraints } = get();
    let activeRoute: Route | null = get().activeRoute;
    if (startLocation && endLocation) {
      activeRoute = computeRouteForBuildings(graph, startLocation, endLocation, constraints, budget);
    }
    set({ timeBudget: budget, activeRoute });
  },

  setStartLocation: (building) => {
    const { endLocation, graph, constraints, timeBudget } = get();
    let activeRoute: Route | null = null;
    if (building && endLocation) {
      activeRoute = computeRouteForBuildings(graph, building, endLocation, constraints, timeBudget);
    }
    set({ startLocation: building, activeRoute });
  },

  setEndLocation: (building) => {
    const { startLocation, graph, constraints, timeBudget } = get();
    let activeRoute: Route | null = null;
    if (startLocation && building) {
      activeRoute = computeRouteForBuildings(graph, startLocation, building, constraints, timeBudget);
    }
    set({ endLocation: building, activeRoute });
  },

  setActiveRoute: (route) => {
    set({ activeRoute: route });
  },

  toggleCommunityLayer: () => {
    set((state) => ({ communityLayerEnabled: !state.communityLayerEnabled }));
  },

  addShortcut: (shortcut) => {
    const { graph, shortcuts } = get();
    const updatedGraph = addShortcutEdge(graph, shortcut);
    set({ shortcuts: [...shortcuts, shortcut], graph: updatedGraph });
  },

  voteOnShortcut: (id, direction) => {
    const { shortcuts, sessionVotes, graph } = get();
    if (sessionVotes.has(id)) return;

    const updatedShortcuts = shortcuts.map((s) => {
      if (s.id !== id) return s;
      const upvotes = direction === 'up' ? s.upvotes + 1 : s.upvotes;
      const downvotes = direction === 'down' ? s.downvotes + 1 : s.downvotes;
      return { ...s, upvotes, downvotes, popularityScore: upvotes - downvotes };
    });

    const updatedVotes = new Set(sessionVotes);
    updatedVotes.add(id);

    // Rebuild graph with updated shortcut weights
    const updatedShortcut = updatedShortcuts.find((s) => s.id === id);
    let updatedGraph = graph;
    if (updatedShortcut) {
      // Re-add the shortcut edge with updated popularity
      updatedGraph = addShortcutEdge(graph, updatedShortcut);
    }

    set({ shortcuts: updatedShortcuts, sessionVotes: updatedVotes, graph: updatedGraph });
  },

  seedDemoData: () => {
    const graph = buildGraph(demoBuildings, demoShortcuts);
    set({
      graph,
      shortcuts: demoShortcuts,
      activeRoute: null,
      startLocation: null,
      endLocation: null,
    });
  },

  setActiveShortcut: (shortcut) => {
    set({ activeShortcut: shortcut });
  },

  setIsAddingShortcut: (value) => {
    set({ isAddingShortcut: value });
  },

  addWaypoint: (latlng) => {
    set((state) => ({ waypoints: [...state.waypoints, latlng] }));
  },

  undoLastWaypoint: () => {
    set((state) => ({ waypoints: state.waypoints.slice(0, -1) }));
  },

  clearWaypoints: () => {
    set({ waypoints: [] });
  },
}));
