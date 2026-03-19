import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useStore } from '../store/useStore';
import { demoBuildings } from '../data/demo';
import { Shortcut } from '../types';

const COMMUNITY_SOURCE_ID = 'community-shortcuts';
const COMMUNITY_LAYER_ID = 'community-shortcuts-line';
const SAFETY_SOURCE_ID = 'unsafe-segments';
const SAFETY_LAYER_ID = 'unsafe-segments-line';
const COMMUNITY_COLOR = '#6EE7B7';
const TOP_SHORTCUT_COLOR = '#F59E0B';

const CAMPUS_CENTER: [number, number] = [-97.7394, 30.2849];
const CAMPUS_ZOOM = 15.5;
const ROUTE_SOURCE_ID = 'active-route';
const ROUTE_LAYER_ID_GLOW = 'active-route-glow';
const ROUTE_LAYER_ID = 'active-route-line';
const ROUTE_ANIM_DURATION_MS = 700;

const WAYPOINT_SOURCE_ID = 'waypoint-preview';
const WAYPOINT_LAYER_ID = 'waypoint-preview-line';

/** Color route line based on active constraint */
function getRouteColor(constraints: string[]): string {
  if (constraints.includes('safety')) return '#22C55E';
  if (constraints.includes('low-crowd')) return '#8B5CF6';
  return '#4F7CFF';
}

/** Compute midpoint of a coordinate array */
function midpoint(coords: [number, number][]): [number, number] {
  const mid = Math.floor(coords.length / 2);
  return coords[mid];
}

function getBuildingBounds(): mapboxgl.LngLatBoundsLike {
  const lngs = demoBuildings.map((b) => b.coordinates.lng);
  const lats = demoBuildings.map((b) => b.coordinates.lat);
  return [
    [Math.min(...lngs) - 0.002, Math.min(...lats) - 0.002],
    [Math.max(...lngs) + 0.002, Math.max(...lats) + 0.002],
  ];
}

interface MapViewProps {
  onShortcutClick?: (shortcut: Shortcut) => void;
}

export default function MapView({ onShortcutClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const accessibilityMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const topShortcutMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const endMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const waypointMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const onShortcutClickRef = useRef(onShortcutClick);
  onShortcutClickRef.current = onShortcutClick;
  const [mapError, setMapError] = useState(false);

  const activeRoute = useStore((s) => s.activeRoute);
  const communityLayerEnabled = useStore((s) => s.communityLayerEnabled);
  const shortcuts = useStore((s) => s.shortcuts);
  const constraints = useStore((s) => s.constraints);
  const graph = useStore((s) => s.graph);
  const isAddingShortcut = useStore((s) => s.isAddingShortcut);
  const waypoints = useStore((s) => s.waypoints);
  const addWaypoint = useStore((s) => s.addWaypoint);
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  // Initialize map once on mount
  useEffect(() => {
    if (!token) { setMapError(true); return; }
    if (!containerRef.current) return;

    mapboxgl.accessToken = token;

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: CAMPUS_CENTER,
        zoom: CAMPUS_ZOOM,
      });
    } catch {
      setMapError(true);
      return;
    }

    mapRef.current = map;
    map.on('error', () => setMapError(true));

    map.on('load', () => {
      map.fitBounds(getBuildingBounds(), { padding: 60, duration: 800 });

      demoBuildings.forEach((building) => {
        const el = document.createElement('div');
        el.style.cssText = `
          width: 12px; height: 12px; border-radius: 50%;
          background: #4F7CFF; border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3); cursor: pointer;
        `;
        const popup = new mapboxgl.Popup({ offset: 10, closeButton: false }).setText(building.name);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([building.coordinates.lng, building.coordinates.lat])
          .setPopup(popup)
          .addTo(map);
        el.addEventListener('click', () => marker.togglePopup());
        markersRef.current.push(marker);
      });
    });

    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map click handler for adding waypoints
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: mapboxgl.MapMouseEvent) => {
      if (!useStore.getState().isAddingShortcut) return;
      addWaypoint({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    };

    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [addWaypoint]);

  // Cursor style when adding shortcut
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = isAddingShortcut ? 'crosshair' : '';
  }, [isAddingShortcut]);

  // Render waypoint markers + live preview line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old waypoint markers
    waypointMarkersRef.current.forEach((m) => m.remove());
    waypointMarkersRef.current = [];

    // Remove old preview line
    if (map.isStyleLoaded()) {
      if (map.getLayer(WAYPOINT_LAYER_ID)) map.removeLayer(WAYPOINT_LAYER_ID);
      if (map.getSource(WAYPOINT_SOURCE_ID)) map.removeSource(WAYPOINT_SOURCE_ID);
    }

    if (!isAddingShortcut || waypoints.length === 0) return;

    // Add numbered circle markers
    waypoints.forEach((wp, i) => {
      const el = document.createElement('div');
      el.textContent = String(i + 1);
      el.style.cssText = `
        width: 24px; height: 24px; border-radius: 50%;
        background: #4F7CFF; color: #fff;
        font-size: 12px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        border: 2px solid #fff;
        box-shadow: 0 2px 6px rgba(79,124,255,0.4);
        font-family: Inter, sans-serif;
      `;
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([wp.lng, wp.lat])
        .addTo(map);
      waypointMarkersRef.current.push(marker);
    });

    // Draw preview line if 2+ waypoints
    if (waypoints.length >= 2 && map.isStyleLoaded()) {
      const coords = waypoints.map((wp) => [wp.lng, wp.lat] as [number, number]);
      map.addSource(WAYPOINT_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
      });
      map.addLayer({
        id: WAYPOINT_LAYER_ID,
        type: 'line',
        source: WAYPOINT_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#4F7CFF', 'line-width': 3, 'line-dasharray': [2, 2], 'line-opacity': 0.7 },
      });
    }
  }, [isAddingShortcut, waypoints]);

  // React to activeRoute changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Remove existing route layers/sources
    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
    if (map.getLayer(ROUTE_LAYER_ID_GLOW)) map.removeLayer(ROUTE_LAYER_ID_GLOW);
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);

    // Remove start/end markers
    startMarkerRef.current?.remove();
    startMarkerRef.current = null;
    endMarkerRef.current?.remove();
    endMarkerRef.current = null;

    if (!activeRoute || activeRoute.segments.length === 0) return;

    const routeColor = getRouteColor(activeRoute.activeConstraints);

    const allCoords: [number, number][] = [];
    activeRoute.segments.forEach((seg, i) => {
      const fromNode = useStore.getState().graph.nodes.get(seg.from);
      const toNode = useStore.getState().graph.nodes.get(seg.to);
      if (fromNode && i === 0) allCoords.push([fromNode.coordinates.lng, fromNode.coordinates.lat]);
      if (toNode) allCoords.push([toNode.coordinates.lng, toNode.coordinates.lat]);
    });

    if (allCoords.length < 2) return;

    map.addSource(ROUTE_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
    });

    // Glow layer (wider, blurred, behind)
    map.addLayer({
      id: ROUTE_LAYER_ID_GLOW,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': routeColor, 'line-width': 16, 'line-blur': 12, 'line-opacity': 0.3 },
    });

    // Main route line
    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': routeColor, 'line-width': 7, 'line-blur': 0.5 },
    });

    // Animate route drawing
    const totalPoints = allCoords.length;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / ROUTE_ANIM_DURATION_MS, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      const visibleCount = Math.max(2, Math.round(eased * (totalPoints - 1)) + 1);
      const visibleCoords = allCoords.slice(0, visibleCount);

      const source = map!.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (source) {
        source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: visibleCoords } });
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animFrameRef.current = null;
        // Add start/end markers after animation completes
        addEndpointMarkers(allCoords, routeColor);
      }
    }

    function addEndpointMarkers(coords: [number, number][], color: string) {
      // Start marker — green dot
      const startEl = document.createElement('div');
      startEl.style.cssText = `
        width: 16px; height: 16px; border-radius: 50%;
        background: #22C55E; border: 3px solid #fff;
        box-shadow: 0 2px 8px rgba(34,197,94,0.5);
      `;
      startMarkerRef.current = new mapboxgl.Marker({ element: startEl })
        .setLngLat(coords[0])
        .addTo(map!);

      // End marker — colored pin
      const endEl = document.createElement('div');
      endEl.style.cssText = `
        width: 20px; height: 20px; border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${color}; border: 3px solid #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      `;
      endMarkerRef.current = new mapboxgl.Marker({ element: endEl, anchor: 'bottom-left' })
        .setLngLat(coords[coords.length - 1])
        .addTo(map!);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    const bounds = allCoords.reduce(
      (b, c) => b.extend(c as [number, number]),
      new mapboxgl.LngLatBounds(allCoords[0], allCoords[0])
    );
    map.fitBounds(bounds, { padding: 80, duration: 500 });
  }, [activeRoute]);

  // Community layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer(COMMUNITY_LAYER_ID)) map.removeLayer(COMMUNITY_LAYER_ID);
    if (map.getSource(COMMUNITY_SOURCE_ID)) map.removeSource(COMMUNITY_SOURCE_ID);
    topShortcutMarkerRef.current?.remove();
    topShortcutMarkerRef.current = null;

    if (!communityLayerEnabled || shortcuts.length === 0) return;

    const topShortcut = shortcuts.reduce((best, s) =>
      s.popularityScore > best.popularityScore ? s : best, shortcuts[0]);

    const features = shortcuts.map((shortcut) => ({
      type: 'Feature' as const,
      properties: { id: shortcut.id, isTop: shortcut.id === topShortcut.id },
      geometry: {
        type: 'LineString' as const,
        coordinates: shortcut.coordinates.map((c) => [c.lng, c.lat] as [number, number]),
      },
    }));

    map.addSource(COMMUNITY_SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features } });
    map.addLayer({
      id: COMMUNITY_LAYER_ID,
      type: 'line',
      source: COMMUNITY_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['case', ['==', ['get', 'isTop'], true], TOP_SHORTCUT_COLOR, COMMUNITY_COLOR],
        'line-width': ['case', ['==', ['get', 'isTop'], true], 4, 3],
        'line-dasharray': [2, 2],
        'line-opacity': 1,
      },
    });

    const clickHandler = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const clicked = shortcuts.find((s) => s.id === feature.properties?.id);
      if (clicked) onShortcutClickRef.current?.(clicked);
    };
    map.on('click', COMMUNITY_LAYER_ID, clickHandler);
    map.on('mouseenter', COMMUNITY_LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', COMMUNITY_LAYER_ID, () => { map.getCanvas().style.cursor = ''; });

    const topCoords = topShortcut.coordinates.map((c) => [c.lng, c.lat] as [number, number]);
    const [midLng, midLat] = midpoint(topCoords);
    const badgeEl = document.createElement('div');
    badgeEl.textContent = '⭐ Top Shortcut';
    badgeEl.style.cssText = `
      background: ${TOP_SHORTCUT_COLOR}; color: #fff; font-size: 11px; font-weight: 600;
      padding: 3px 8px; border-radius: 999px; white-space: nowrap;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25); pointer-events: none;
    `;
    topShortcutMarkerRef.current = new mapboxgl.Marker({ element: badgeEl, anchor: 'bottom' })
      .setLngLat([midLng, midLat]).addTo(map);

    return () => { map.off('click', COMMUNITY_LAYER_ID, clickHandler); };
  }, [communityLayerEnabled, shortcuts]);

  // Accessibility markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    accessibilityMarkersRef.current.forEach((m) => m.remove());
    accessibilityMarkersRef.current = [];
    if (!constraints.includes('accessibility')) return;

    const addMarkers = () => {
      demoBuildings.forEach((building) => {
        building.entrances.forEach((entrance) => {
          if (!entrance.tags.includes('accessible') && !entrance.tags.includes('stair-free')) return;
          const el = document.createElement('div');
          el.textContent = '♿';
          el.style.cssText = `
            width: 24px; height: 24px; border-radius: 50%; background: #22C55E; color: #fff;
            font-size: 13px; display: flex; align-items: center; justify-content: center;
            border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          `;
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([entrance.coordinates.lng, entrance.coordinates.lat]).addTo(map);
          accessibilityMarkersRef.current.push(marker);
        });
      });
    };

    if (map.isStyleLoaded()) addMarkers();
    else map.once('load', addMarkers);
  }, [constraints]);

  // Safety indicators
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer(SAFETY_LAYER_ID)) map.removeLayer(SAFETY_LAYER_ID);
    if (map.getSource(SAFETY_SOURCE_ID)) map.removeSource(SAFETY_SOURCE_ID);
    if (!constraints.includes('safety')) return;

    const unsafeFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    graph.edges.forEach((segments) => {
      segments.forEach((seg) => {
        if (!seg.tags.includes('poorly-lit') && !seg.tags.includes('isolated')) return;
        const fromNode = graph.nodes.get(seg.from);
        const toNode = graph.nodes.get(seg.to);
        if (!fromNode || !toNode) return;
        unsafeFeatures.push({
          type: 'Feature', properties: { id: seg.id },
          geometry: { type: 'LineString', coordinates: [[fromNode.coordinates.lng, fromNode.coordinates.lat], [toNode.coordinates.lng, toNode.coordinates.lat]] },
        });
      });
    });

    if (unsafeFeatures.length === 0) return;
    map.addSource(SAFETY_SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: unsafeFeatures } });
    map.addLayer({
      id: SAFETY_LAYER_ID, type: 'line', source: SAFETY_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#EF4444', 'line-width': 3, 'line-dasharray': [2, 2], 'line-opacity': 0.85 },
    });
  }, [constraints, graph]);

  if (mapError || !token) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', color: '#64748B', fontSize: '16px', textAlign: 'center', padding: '24px' }}>
        Map cannot be loaded. Please check your connection.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {activeRoute && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.12)', pointerEvents: 'none' }} />
      )}
    </div>
  );
}
