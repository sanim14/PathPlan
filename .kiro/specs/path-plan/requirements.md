# Requirements Document

## Introduction

PathPlan is a community-powered campus navigation web application that provides optimized walking routes based on real student behavior. Unlike generic map applications, PathPlan incorporates indoor shortcuts, accessibility constraints, safety preferences, and time-aware routing — all informed by community-submitted paths and ratings. The app targets students who need fast, realistic navigation across a university campus and is designed as a polished, mobile-first prototype.

## Glossary

- **PathPlan**: The campus navigation web application being built.
- **Router**: The client-side routing engine responsible for computing walking paths between two locations.
- **Map**: The interactive Mapbox-powered map interface rendered in the browser.
- **Shortcut**: A community-submitted walking path with associated tags, upvotes, and downvotes.
- **Route**: A computed path between a start and end location, including estimated time and an explanation string.
- **Constraint**: A user-selected toggle that modifies routing behavior (e.g., avoid stairs, night safe, low crowd).
- **Community_Layer**: The visual overlay on the Map showing community-submitted Shortcuts.
- **Accessibility_Mode**: A Constraint that avoids stairs and prioritizes ramps, elevators, and accessible entrances.
- **Safety_Mode**: A Constraint that avoids poorly lit or isolated paths and prefers main walkways.
- **Time_Budget**: A user-selected time window (5, 10, or 15 minutes) that adjusts route aggressiveness.
- **Weight**: A numeric score assigned to a path segment representing distance, crowd level, safety, accessibility, or popularity.
- **Backend**: The Node.js/Express or Firebase server responsible for storing and serving Shortcuts and Routes.
- **Database**: The Firestore or PostgreSQL data store holding Shortcut and Route records.
- **Demo_Data**: Pre-loaded sample buildings, Shortcuts, and ratings that allow the app to function without user input.

---

## Requirements

### Requirement 1: Interactive Map Interface

**User Story:** As a student, I want to see an interactive campus map when I open the app, so that I can immediately orient myself and begin navigating.

#### Acceptance Criteria

1. THE Map SHALL render a full-screen interactive campus map on application load using Mapbox GL JS.
2. THE Map SHALL display campus buildings, walkable outdoor paths, and indoor connectors (hallways, tunnels) as distinct visual layers.
3. THE Map SHALL load and display Demo_Data instantly without requiring any user input.
4. WHEN the Map finishes loading, THE Map SHALL center on the campus and fit all buildings within the viewport.
5. IF the Mapbox tile service is unavailable, THEN THE Map SHALL display a fallback message indicating that the map cannot be loaded.

---

### Requirement 2: Route Search and Input

**User Story:** As a student, I want to enter a start location and an end location, so that I can request a walking route between them.

#### Acceptance Criteria

1. THE PathPlan SHALL provide a search interface with two input fields: one for the start location and one for the end location.
2. WHEN a student types in a location input field, THE PathPlan SHALL display autocomplete suggestions drawn from known campus buildings and named locations.
3. WHEN a student selects both a start and end location, THE Router SHALL compute and display a Route on the Map.
4. IF a student submits a route request with an empty start or end field, THEN THE PathPlan SHALL display an inline validation message indicating the missing field.
5. IF no Route can be computed between the selected locations, THEN THE Router SHALL display a message explaining that no path was found.

---

### Requirement 3: Smart Routing Engine

**User Story:** As a student, I want the routing engine to compute realistic walking paths using student-submitted shortcuts and weighted constraints, so that I get routes that reflect how students actually move on campus.

#### Acceptance Criteria

1. THE Router SHALL compute Routes using a graph-based algorithm where each edge carries Weights for distance, crowd level, safety score, accessibility score, and popularity.
2. WHEN a student activates one or more Constraints, THE Router SHALL adjust the edge Weights corresponding to those Constraints before computing the Route.
3. THE Router SHALL include community-submitted Shortcuts as traversable edges in the routing graph, weighted by their popularity score.
4. WHEN a Route is computed, THE Router SHALL produce an explanation string describing the primary routing decision (e.g., "avoids stairs and uses indoor shortcut", "prioritizes safety with well-lit paths").
5. WHEN a Route is computed, THE Router SHALL produce an estimated walking time in minutes based on path distance and a standard walking speed of 1.4 meters per second.
6. IF two Routes have equal total Weight, THE Router SHALL prefer the Route with the higher combined safety and popularity score.

---

### Requirement 4: Route Display and Animation

**User Story:** As a student, I want to see my route drawn on the map with a smooth animation, so that the path is easy to follow and visually clear.

#### Acceptance Criteria

1. WHEN a Route is computed, THE Map SHALL animate the route line drawing from start to end over a duration of 600–900 milliseconds.
2. WHEN a Route is active, THE Map SHALL visually highlight the active route line and subtly dim non-route map elements.
3. WHEN a Route is active, THE PathPlan SHALL display a bottom sheet panel containing the estimated time, the explanation string, and the active Constraints.
4. THE bottom sheet panel SHALL slide up from the bottom of the screen with a smooth transition of 300–400 milliseconds.
5. WHEN a student dismisses the bottom sheet, THE PathPlan SHALL allow the sheet to be dragged down to close.

---

### Requirement 5: Routing Constraints (Toggles)

**User Story:** As a student, I want to toggle routing preferences such as avoiding stairs or choosing night-safe paths, so that the route adapts to my current needs.

#### Acceptance Criteria

1. THE PathPlan SHALL provide toggle controls for the following Constraints: Fastest Path, Accessibility_Mode (avoid stairs), Safety_Mode (night safe), and Low Crowd.
2. WHEN a student activates or deactivates a Constraint toggle, THE toggle SHALL animate its state change over 200–300 milliseconds.
3. WHEN a student changes any Constraint toggle while a Route is active, THE Router SHALL recompute the Route using the updated Constraints and re-animate the route line.
4. WHILE Accessibility_Mode is active, THE Router SHALL exclude path segments that require stair traversal and SHALL prefer segments with ramps, elevators, or accessible entrances.
5. WHILE Safety_Mode is active, THE Router SHALL exclude path segments tagged as poorly lit or isolated and SHALL prefer main walkways.
6. WHILE Low Crowd is active, THE Router SHALL deprioritize path segments with high crowd Weight values.

---

### Requirement 6: Time-Aware Routing

**User Story:** As a student, I want to specify how much time I have to reach my destination, so that the route adjusts its aggressiveness to fit my schedule.

#### Acceptance Criteria

1. THE PathPlan SHALL provide a Time_Budget selector with options of 5, 10, and 15 minutes.
2. WHEN a student selects a Time_Budget of 5 minutes, THE Router SHALL maximize the use of Shortcuts and indoor connectors to minimize total path distance.
3. WHEN a student selects a Time_Budget of 15 minutes, THE Router SHALL prefer main walkways and safer, more direct paths over aggressive shortcuts.
4. WHEN a student selects a Time_Budget of 10 minutes, THE Router SHALL apply a balanced weighting between shortcut usage and path safety.
5. WHEN a Route is computed and the estimated time exceeds the selected Time_Budget, THE PathPlan SHALL display a warning indicating the route may not fit within the selected time.

---

### Requirement 7: Community-Contributed Shortcuts

**User Story:** As a student, I want to submit walking shortcuts I've discovered on campus, so that other students can benefit from my local knowledge.

#### Acceptance Criteria

1. THE PathPlan SHALL provide an Add Shortcut screen where a student can draw a path on the Map by placing waypoints.
2. WHEN a student draws a Shortcut path, THE PathPlan SHALL allow the student to assign one or more tags from the set: indoor, hidden shortcut, unsafe at night, crowded between classes.
3. WHEN a student submits a Shortcut, THE Backend SHALL store the Shortcut in the Database with fields: id, coordinates (array of lat/lng), tags, upvotes, downvotes, and popularity score.
4. WHEN a Shortcut is submitted, THE Backend SHALL compute the initial popularity score as upvotes minus downvotes.
5. IF a student submits a Shortcut with fewer than two coordinate points, THEN THE PathPlan SHALL display a validation error and SHALL NOT submit the Shortcut to the Backend.
6. WHEN a Shortcut is successfully submitted, THE PathPlan SHALL display a confirmation message and return the student to the Map screen.

---

### Requirement 8: Shortcut Voting

**User Story:** As a student, I want to upvote or downvote community shortcuts, so that the best paths rise to the top and poor ones are deprioritized.

#### Acceptance Criteria

1. THE PathPlan SHALL display upvote and downvote controls on each Shortcut detail panel.
2. WHEN a student submits an upvote or downvote on a Shortcut, THE Backend SHALL increment the corresponding counter and recompute the popularity score as upvotes minus downvotes.
3. WHEN the popularity score of a Shortcut is updated, THE Router SHALL use the updated Weight on the next Route computation.
4. IF a student attempts to vote on a Shortcut more than once in the same session, THEN THE PathPlan SHALL display a message indicating the student has already voted.

---

### Requirement 9: Community Layer Overlay

**User Story:** As a student, I want to toggle a layer showing popular community shortcuts on the map, so that I can explore paths other students have discovered.

#### Acceptance Criteria

1. THE PathPlan SHALL provide a toggle to enable or disable the Community_Layer on the Map.
2. WHEN the Community_Layer is enabled, THE Map SHALL render all stored Shortcuts as visually distinct path overlays, differentiated from standard route lines by color and line style.
3. WHEN a student taps or clicks a Shortcut on the Community_Layer, THE PathPlan SHALL display a detail panel showing the Shortcut's tags, upvote count, downvote count, and popularity score.
4. WHEN the Community_Layer is enabled, THE Map SHALL visually distinguish the top-rated Shortcut with a "Top Student Shortcut" label or badge.
5. WHEN the Community_Layer is disabled, THE Map SHALL remove all Shortcut overlays from the display.

---

### Requirement 10: Accessibility Mode

**User Story:** As a student with mobility constraints, I want to enable accessibility mode, so that my route avoids stairs and uses accessible infrastructure.

#### Acceptance Criteria

1. WHILE Accessibility_Mode is active, THE Router SHALL only traverse path segments tagged as stair-free.
2. WHILE Accessibility_Mode is active, THE Router SHALL prefer path segments tagged with ramp, elevator, or accessible entrance.
3. WHILE Accessibility_Mode is active, THE Map SHALL highlight accessible entrances and ramp locations as distinct map markers.
4. IF no stair-free Route exists between the selected locations, THEN THE Router SHALL inform the student that a fully accessible route could not be found and SHALL suggest the nearest accessible alternative.

---

### Requirement 11: Safety Mode

**User Story:** As a student navigating at night, I want to enable safety mode, so that my route avoids isolated or poorly lit areas.

#### Acceptance Criteria

1. WHILE Safety_Mode is active, THE Router SHALL exclude path segments tagged as poorly lit or isolated.
2. WHILE Safety_Mode is active, THE Router SHALL prefer path segments tagged as main walkway or well lit.
3. WHILE Safety_Mode is active, THE Map SHALL visually indicate which path segments are considered safe versus unsafe.
4. IF no Safety_Mode-compliant Route exists between the selected locations, THEN THE Router SHALL fall back to the safest available Route and SHALL notify the student that a fully safe route could not be constructed.

---

### Requirement 12: Demo Data and Instant Load

**User Story:** As a demo viewer, I want the app to work immediately with preloaded data, so that the demo flow can be executed without setup.

#### Acceptance Criteria

1. THE PathPlan SHALL preload a minimum of 10 campus buildings with names and coordinates into the Database or local data store before the first user interaction.
2. THE PathPlan SHALL preload a minimum of 10 community Shortcuts with varied tags and ratings into the Database or local data store.
3. WHEN the application loads, THE Map SHALL display all preloaded buildings and the Community_Layer SHALL be available for activation immediately.
4. THE PathPlan SHALL support the following demo flow without requiring user account creation or login: select Library as start, select Engineering Building as end, compute Route, toggle Accessibility_Mode, toggle Safety_Mode, enable Community_Layer, view a Shortcut detail, submit a new Shortcut.
5. THE PathPlan SHALL render the initial map view and demo data within 1 second to ensure a seamless demo experience.

---

### Requirement 13: Route Explanation

**User Story:** As a student, I want each route to include a plain-language explanation of why it was chosen, so that I understand the trade-offs being made.

#### Acceptance Criteria

1. THE Router SHALL generate an explanation string for every computed Route.
2. THE explanation string SHALL reference at least one active Constraint or routing factor (e.g., "avoids stairs and uses indoor shortcut", "fastest based on student-submitted shortcuts", "prioritizes safety with well-lit paths").
3. THE PathPlan SHALL display the explanation string prominently in the Route bottom sheet panel.
4. WHEN Constraints change and the Route is recomputed, THE PathPlan SHALL update the displayed explanation string to reflect the new routing decision.
5. THE explanation string SHALL be concise, human-readable, and understandable within 2 seconds of reading.

---

### Requirement 14: UI Polish and Interaction Quality

**User Story:** As a student, I want the app to feel fast, smooth, and visually polished, so that it feels like a real product built for campus use.

#### Acceptance Criteria

1. THE PathPlan SHALL use a color palette of off-white (#F8FAFC) for backgrounds, muted blue (#4F7CFF) as the primary accent, and soft green (#6EE7B7) as the secondary accent.
2. THE PathPlan SHALL apply rounded corners of 16–20px to all card and panel components.
3. THE PathPlan SHALL apply subtle glassmorphism (translucent background with backdrop blur) to floating panels overlaid on the Map.
4. THE PathPlan SHALL use the Inter typeface (or equivalent clean sans-serif) with a maximum of three distinct font sizes across the interface.
5. WHEN a student interacts with any toggle, button, or interactive element, THE PathPlan SHALL provide visible animated feedback within 100 milliseconds of the interaction.
6. THE PathPlan SHALL be fully functional and visually correct on mobile viewport widths of 375px and above.
7. THE PathPlan SHALL be fully functional and visually correct on desktop viewport widths of 1024px and above.
8. THE PathPlan SHALL animate route transitions, layer toggles, and UI panel movements using smooth easing functions to create a premium, fluid experience.
