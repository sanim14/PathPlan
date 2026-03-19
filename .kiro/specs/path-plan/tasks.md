# Implementation Plan: PathPlan

## Overview

Build a mobile-first campus navigation web app with client-side Dijkstra routing, Mapbox GL JS map, Zustand state, and Firebase Firestore for community shortcuts. Tasks follow the demo flow: load → search → route → toggle constraints → community layer → shortcut interaction.

Stack: React + TypeScript, Mapbox GL JS, Zustand, fast-check (tests), Firebase Firestore.

## Tasks

- [x] 1. Project setup and core TypeScript interfaces
  - Scaffold Vite + React + TypeScript project with flat `src/components`, `src/engine`, `src/store`, `src/data`, `src/firebase` folders
  - Install dependencies: mapbox-gl, zustand, firebase, fast-check, vitest, @testing-library/react
  - Define all core interfaces in `src/types.ts`: `LatLng`, `Building`, `Entrance`, `PathSegment`, `SegmentTag`, `SegmentWeights`, `Shortcut`, `Route`, `Constraint`, `TimeBudget`, `Graph`, `GraphNode`, `RouterConfig`
  - Configure `vitest.config.ts` with jsdom environment and `src/test/setup.ts`
  - _Requirements: 3.1, 7.3_

- [x] 2. Demo data and graph construction
  - [x] 2.1 Create `src/data/demo.ts` with ≥10 campus buildings (names, coordinates, entrances with tags) and ≥10 community shortcuts with varied tags and ratings
    - Include Library and Engineering Building as named entries to support the demo flow
    - Shortcuts must have varied tags: indoor, hidden-shortcut, unsafe-at-night, crowded-between-classes
    - All shortcuts must have ≥2 coordinate points
    - _Requirements: 12.1, 12.2, 12.4_
  - [ ]* 2.2 Write unit tests for demo data invariants
    - Assert ≥10 buildings present
    - Assert ≥10 shortcuts present
    - Assert all shortcuts have ≥2 coordinate points
    - _Requirements: 12.1, 12.2_
  - [x] 2.3 Implement `src/engine/graph.ts` — `buildGraph(buildings, shortcuts): Graph`
    - Construct nodes from building entrances; edges from path segments and shortcut coordinates
    - Expose `addShortcutEdge(graph, shortcut): Graph` for incremental updates
    - _Requirements: 3.1, 3.3_

- [x] 3. Routing engine
  - [x] 3.1 Implement `edgeCost(seg, cfg): number` and `getRouterConfig(constraints, timeBudget): RouterConfig` in `src/engine/router.ts`
    - Use the weighted-sum formula from the design doc
    - Apply constraint presets (wDistance, wCrowd, wSafety, wAccess, wPop) per the design table
    - Apply time budget shortcut bonus (wPop 2.0 / 1.0 / 0.5)
    - Assign infinite cost to stair segments when accessibility is active; to poorly-lit/isolated segments when safety is active
    - _Requirements: 3.1, 3.2, 5.4, 5.5, 5.6, 6.2, 6.3, 6.4_
  - [ ]* 3.2 Write property test for route uses valid edges (Property 1)
    - **Property 1: Route only uses edges present in the graph**
    - **Validates: Requirements 3.1**
    - Use `arbGraph` and `arbConstraint` arbitraries; assert every segment in the result exists in the graph and total weight equals sum of edge weights
  - [x] 3.3 Implement `computeRoute(graph, startId, endId, constraints, timeBudget): Route | null` using Dijkstra's algorithm
    - Return `null` when no path exists
    - When two routes have equal total weight, prefer higher combined safety + popularity score (tiebreak)
    - _Requirements: 3.1, 3.6, 2.5_
  - [ ]* 3.4 Write property test for constraint invariant (Property 2)
    - **Property 2: Constraint application satisfies its invariant**
    - **Validates: Requirements 3.2, 5.4, 5.5, 5.6, 10.1, 11.1**
    - Use `arbGraph` with mixed-tag segments; assert accessibility routes have no stair segments, safety routes have no poorly-lit/isolated segments, low-crowd routes have lower average crowd weight than unconstrained
  - [ ]* 3.5 Write property test for walking time formula (Property 3)
    - **Property 3: Walking time formula is correct**
    - **Validates: Requirements 3.5**
    - Use `arbRoute` arbitrary; assert `estimatedTime ≈ totalDistance / 1.4 / 60`
  - [ ]* 3.6 Write unit tests for router edge cases
    - Empty graph → null route
    - Start equals end → zero-distance route
    - Accessibility mode + no stair-free path → fallback route returned (not null)
    - Safety mode + no safe path → fallback route returned (not null)
    - Equal-weight routes → prefer higher safety+popularity score
    - _Requirements: 3.6, 10.4, 11.4_

- [x] 4. Route explanation generator
  - [x] 4.1 Implement `generateExplanation(route): string` in `src/engine/explanation.ts`
    - Reference at least one active constraint or routing factor in the output string
    - Produce concise, human-readable strings (e.g., "avoids stairs and uses indoor shortcut")
    - _Requirements: 3.4, 13.1, 13.2, 13.5_
  - [ ]* 4.2 Write unit tests for explanation generator
    - Assert explanation references active constraint when one is set
    - Assert explanation is non-empty for any valid route
    - _Requirements: 13.1, 13.2_

- [x] 5. Zustand store
  - Implement `src/store/useStore.ts` with full `AppState` shape: graph, shortcuts, activeRoute, constraints, timeBudget, communityLayerEnabled, sessionVotes, startLocation, endLocation
  - Expose actions: `setConstraint`, `setTimeBudget`, `setStartLocation`, `setEndLocation`, `setActiveRoute`, `toggleCommunityLayer`, `addShortcut`, `voteOnShortcut`, `seedDemoData`
  - `seedDemoData` loads from `demo.ts` and builds the graph via `buildGraph`
  - _Requirements: 3.2, 5.3, 8.4, 9.1_

- [x] 6. Firebase Firestore integration
  - [x] 6.1 Implement `src/firebase/shortcuts.ts` — `saveShortcut(shortcut)`, `fetchShortcuts()`, `voteOnShortcut(id, type: 'up'|'down')`
    - `voteOnShortcut` increments the counter and recomputes `popularityScore = upvotes - downvotes` atomically
    - Guard against duplicate votes using `sessionVotes` set in the store (no Firestore write if already voted)
    - _Requirements: 7.3, 7.4, 8.2, 8.4_
  - [ ]* 6.2 Write property test for vote popularity invariant (Property 4)
    - **Property 4: Vote popularity invariant**
    - **Validates: Requirements 8.2, 7.4**
    - Use `arbShortcut` and a sequence of random up/down vote operations; assert `popularityScore === upvotes - downvotes` after every operation
  - [ ]* 6.3 Write property test for shortcut round-trip (Property 5)
    - **Property 5: Shortcut submission round-trip**
    - **Validates: Requirements 7.3, 7.4**
    - Use `arbShortcut` (coordinates.length ≥ 2); write to Firestore mock and read back; assert all required fields intact and `popularityScore === upvotes - downvotes`
  - [ ]* 6.4 Write unit tests for Firestore validation
    - Shortcut with <2 points → rejected, no write
    - Duplicate vote in same session → no write, returns already-voted signal
    - _Requirements: 7.5, 8.4_

- [x] 7. Checkpoint — core engine complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. MapView component
  - [x] 8.1 Implement `src/components/MapView.tsx` — Mapbox GL JS wrapper
    - Initialize map centered on campus, fitting all buildings in viewport on load
    - Render building markers and walkable path layers from store
    - Expose `animateRoute(route, durationMs)` — draws route line from start to end over 600–900ms with `ease-in-out`; dims non-route elements while route is active
    - Expose `clearRoute()` to remove the active route line
    - Show fallback message when Mapbox is unavailable
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2_
  - [x] 8.2 Add community layer rendering to MapView
    - When `communityLayerEnabled` is true, render all shortcuts as colored dashed overlays distinct from route lines
    - Highlight top-rated shortcut with a "Top Student Shortcut" badge
    - When disabled, remove all shortcut overlays
    - Highlight accessible entrances and ramp markers when Accessibility_Mode is active
    - Visually indicate safe vs unsafe segments when Safety_Mode is active
    - _Requirements: 9.2, 9.4, 9.5, 10.3, 11.3_

- [x] 9. Search panel and autocomplete
  - Implement `src/components/SearchPanel.tsx` with start and end input fields
  - Autocomplete suggestions drawn from `buildings` in the store, filtered by typed text
  - On selection of both start and end, dispatch route computation to the store (calls `computeRoute` + `generateExplanation`, updates `activeRoute`)
  - Inline validation message on empty field submit
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 10. Constraint toggles and time budget selector
  - Implement `src/components/ConstraintToggles.tsx` — four toggles: Fastest Path, Accessibility Mode, Safety Mode, Low Crowd
    - Toggle state change animates over 200–300ms `ease-in-out`
    - On any toggle change while a route is active, trigger route recomputation and re-animation (400–600ms)
    - _Requirements: 5.1, 5.2, 5.3_
  - Implement `src/components/TimeBudgetSelector.tsx` — 5 / 10 / 15 minute options
    - On change, update store and recompute active route if one exists
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 11. Route bottom sheet
  - Implement `src/components/RouteBottomSheet.tsx`
    - Slides up from bottom over 300–400ms `cubic-bezier(0.4, 0, 0.2, 1)` when a route becomes active
    - Displays estimated time, explanation string, and active constraints
    - Drag-to-close gesture animates down over 200–300ms `ease-out`
    - When constraints change and route is recomputed, update displayed explanation string
    - Show time-exceeded warning when `estimatedTime > timeBudget`
    - _Requirements: 4.3, 4.4, 4.5, 6.5, 13.3, 13.4_

- [x] 12. Community layer toggle and shortcut detail panel
  - Add community layer toggle button to the map UI (wired to `toggleCommunityLayer` in store)
    - Layer appears/disappears over 300ms `ease-in-out`
    - _Requirements: 9.1, 9.5_
  - Implement `src/components/ShortcutDetailPanel.tsx`
    - Slides up over 250–350ms `cubic-bezier(0.4, 0, 0.2, 1)` when a shortcut is tapped on the community layer
    - Displays tags, upvote count, downvote count, popularity score
    - _Requirements: 9.3_
  - Implement `src/components/VotingControls.tsx` — upvote/downvote buttons inside ShortcutDetailPanel
    - On vote, call `voteOnShortcut` in store; show "You've already voted" toast if duplicate
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 13. Add Shortcut screen
  - Implement `src/components/AddShortcutScreen.tsx`
    - Waypoint drawing UI: tap map to place points, render preview line
    - Tag selector: indoor, hidden shortcut, unsafe at night, crowded between classes
    - On submit: validate ≥2 points (inline error if not), call `saveShortcut`, update store graph with `addShortcutEdge`, show confirmation, return to map
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_

- [x] 14. Wire everything together in App.tsx
  - [x] 14.1 Compose all components in `src/App.tsx`
    - Call `seedDemoData` on mount; map renders immediately with buildings and community layer ready
    - SearchPanel overlaid on map (glassmorphism panel)
    - ConstraintToggles and TimeBudgetSelector accessible from the map view
    - RouteBottomSheet, ShortcutDetailPanel, AddShortcutScreen rendered conditionally from store state
    - _Requirements: 1.3, 12.3, 12.5_
  - [x] 14.2 Apply global UI polish
    - Color palette: background `#F8FAFC`, primary accent `#4F7CFF`, secondary accent `#6EE7B7`
    - Rounded corners 16–20px on all cards and panels
    - Glassmorphism (translucent background + backdrop-blur) on floating panels
    - Inter typeface, max three distinct font sizes
    - All interactive elements provide visible animated feedback within 100ms
    - Responsive layout correct at 375px and 1024px+ viewports
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [x] 15. Final checkpoint — demo flow validation
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify the full demo flow compiles and runs: load → search Library→Engineering → route animates → toggle Accessibility Mode → toggle Safety Mode → enable community layer → tap shortcut detail → add shortcut → confirmation → return to map

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use fast-check with minimum 100 iterations each, tagged `// Feature: path-plan, Property N: ...`
- All routing is client-side — no server round-trips for route computation
- Firestore is only used for shortcut persistence and votes; all other state lives in Zustand
