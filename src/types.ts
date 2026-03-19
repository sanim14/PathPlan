// Core domain types for PathPlan

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Entrance {
  id: string;
  coordinates: LatLng;
  tags: ('accessible' | 'main' | 'stair-free')[];
}

export interface Building {
  id: string;
  name: string;
  coordinates: LatLng;
  entrances: Entrance[];
}

export type SegmentTag =
  | 'indoor'
  | 'stair'
  | 'ramp'
  | 'elevator'
  | 'poorly-lit'
  | 'isolated'
  | 'main-walkway'
  | 'well-lit'
  | 'crowded';

export interface SegmentWeights {
  distance: number;
  crowdLevel: number;        // 0–1
  safetyScore: number;       // 0–1, higher = safer
  accessibilityScore: number; // 0–1, higher = more accessible
  popularity: number;        // upvotes - downvotes
}

export interface PathSegment {
  id: string;
  from: string;
  to: string;
  distance: number; // meters
  tags: SegmentTag[];
  weights: SegmentWeights;
  shortcutId?: string;
}

export interface Shortcut {
  id: string;
  coordinates: LatLng[];
  tags: ('indoor' | 'hidden-shortcut' | 'unsafe-at-night' | 'crowded-between-classes')[];
  upvotes: number;
  downvotes: number;
  popularityScore: number;
}

export type Constraint = 'fastest' | 'accessibility' | 'safety' | 'low-crowd';

export type TimeBudget = 5 | 10 | 15;

export interface Route {
  segments: PathSegment[];
  totalDistance: number;  // meters
  estimatedTime: number;  // minutes
  explanation: string;
  activeConstraints: Constraint[];
}

export interface GraphNode {
  id: string;
  coordinates: LatLng;
  buildingId?: string;
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, PathSegment[]>; // nodeId → outgoing edges
}

export interface RouterConfig {
  wDistance: number;
  wCrowd: number;
  wSafety: number;
  wAccess: number;
  wPop: number;
}
