# PathPlan

A community-powered campus navigation web app that provides optimized walking routes based on real student behavior. Built as a hackathon demo.

## What it does

- Smart routing with Dijkstra's algorithm, weighted by distance, safety, crowd level, accessibility, and shortcut popularity
- Constraint toggles visibly change the route on the map — each toggle uses exaggerated weights so the path difference is immediately obvious
- Community-submitted shortcuts feed directly into the routing graph
- Tap a shortcut on the map to see a human-readable explanation, votes, and optionally force the router to use it
- "Use this shortcut" button pins a shortcut into the route — router strongly prefers it via popularity boost
- Map-driven shortcut drawing: tap the map to place numbered waypoints, preview the path live, then submit
- Time budget selector (5 / 10 / 15 min) adjusts route aggressiveness
- Animated route drawing with glow effect, color-coded by active constraint
- Floating explanation pill below the search panel summarizes the active route
- Draggable bottom sheet, glassmorphism panels, gradient buttons, micro-interactions throughout

## Constraint behavior

| Toggle | Effect |
|---|---|
| Fastest | Heavily prioritizes distance, ignores crowd/safety |
| No Stairs | Hard-blocks stair segments, prefers ramps |
| Night Safe | Hard-blocks poorly-lit and isolated segments |
| Low Crowd | Heavily penalizes crowded segments |

Route line color changes with the active constraint: blue (fastest), green (night safe), purple (low crowd).

## Tech stack

- React + TypeScript (Vite)
- Mapbox GL JS
- Zustand (state management)
- Firebase Firestore (shortcut persistence)
- Vitest + fast-check (property-based tests)

## Getting started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file from the example:

```bash
cp .env.example .env.local
```

3. Add your Mapbox token to `.env.local`:

```
VITE_MAPBOX_TOKEN=your_token_here
```

Get a free token at [account.mapbox.com](https://account.mapbox.com/access-tokens/).

4. (Optional) Add Firebase config to `.env.local` for shortcut persistence. The app works fully without it using local state.

5. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Demo flow

1. App loads with 12 campus buildings and 12 preloaded shortcuts
2. Type "Library" → From: Perry-Castañeda Library
3. Type "Engineering" → To: Engineering Building
4. Route animates onto the map with time estimate and explanation pill
5. Toggle "No Stairs" → route visibly changes, avoids stair segments
6. Toggle "Night Safe" → route changes again, avoids poorly-lit paths
7. Toggle "Low Crowd" → route shifts to less-crowded segments
8. Tap "🗺️ Shortcuts" → community shortcuts appear as dashed overlays
9. Tap a shortcut → detail panel shows explanation, tags, votes
10. Tap "Use this shortcut" → router recomputes to include it
11. Tap "Add Shortcut" → tap the map to place waypoints, tag it, submit

## Project structure

```
src/
  components/       # All UI components (flat, no nesting)
  engine/           # graph.ts, router.ts, explanation.ts
  store/            # Zustand store (useStore.ts)
  data/             # Demo data (demo.ts)
  firebase/         # Firestore integration (shortcuts.ts, config.ts)
  types.ts          # All TypeScript interfaces
```

## Running tests

```bash
npm test
```
