# PathPlan

A community-powered campus navigation web app that provides optimized walking routes based on real student behavior. Built as a hackathon demo.

## What it does

- Smart routing with Dijkstra's algorithm, weighted by distance, safety, crowd level, accessibility, and shortcut popularity
- Community-submitted shortcuts that feed directly into the routing graph
- Constraint toggles: Fastest, No Stairs (accessibility), Night Safe, Low Crowd
- Time budget selector (5 / 10 / 15 min) that adjusts route aggressiveness
- Community layer showing all student-submitted shortcuts with upvote/downvote voting
- Animated route drawing, draggable bottom sheet, glassmorphism UI

## Tech stack

- React + TypeScript (Vite)
- Mapbox GL JS
- Zustand (state management)
- Firebase Firestore (shortcut persistence)
- fast-check (property-based tests)
- Vitest

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

4. (Optional) Add Firebase config to `.env.local` if you want shortcut persistence. The app works fully without it using local state.

5. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Demo flow

1. App loads instantly with 12 campus buildings and 12 preloaded shortcuts
2. Type "Library" in the From field → select Perry-Castañeda Library
3. Type "Engineering" in the To field → select Engineering Building
4. Route animates onto the map, bottom sheet slides up with time estimate
5. Toggle "No Stairs" → route updates avoiding stair segments
6. Toggle "Night Safe" → route updates avoiding poorly-lit paths
7. Tap "🗺️ Shortcuts" → community shortcuts appear as dashed overlays
8. Tap a shortcut → detail panel shows tags, votes, popularity score
9. Tap "Add Shortcut" → draw waypoints, tag it, submit

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
