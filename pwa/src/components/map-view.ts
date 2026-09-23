// Leaflet map with OpenStreetMap tiles, the counterpart of the Google map fragments of the app:
// a long press (or right click) gives a position, markers use the app's icons

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { h } from '../shell/dom';
import { LatLon } from '../shell/location';

// Centre of Czechia, where the map starts before a position is known
const DEFAULT_CENTER: L.LatLngExpression = [49.8, 15.5];
const DEFAULT_ZOOM = 7;
const POSITION_ZOOM = 16;

const START_ICON = L.divIcon({
  className: 'map-icon',
  html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">'
    + '<circle cx="12" cy="12" r="9.5" fill="#fff" stroke="#1b5e20" stroke-width="1.5"/>'
    + '<circle cx="12" cy="12" r="5.5" fill="#2e7d32"/></svg>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const PIN_ICON = L.divIcon({
  className: 'map-icon',
  html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">'
    + '<path fill="#43a047" stroke="#1b5e20" d="M12 1C7.6 1 4 4.6 4 9c0 6 8 14 8 14s8-8 8-14c0-4.4-3.6-8-8-8z"/>'
    + '<circle cx="12" cy="9" r="3" fill="#fff"/></svg>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Arrow head of ic_arrow_head.xml: its tip reaches 4 px over the point it is anchored at
const ARROW_SIZE = 32;
const ARROW_TIP_PX = 4;
const ARROW_PATH = 'M12,9L19,20L12,16.5L5,20Z';

export interface MapView {
  map: L.Map;
  element: HTMLElement;
  /** Puts the map into the page once its element has a size */
  ready(): void;
  setPosition(position: LatLon, icon?: 'start' | 'pin'): void;
  /** Draws the arrow from the position to the destination, or removes it */
  setArrow(from: LatLon, to: LatLon | null): void;
  moveTo(position: LatLon): void;
  fit(a: LatLon, b: LatLon): void;
  /** Removes the marker and the arrow and shows the whole country again */
  clear(): void;
  destroy(): void;
}

export function mapView(onLongPress: (position: LatLon) => void): MapView {
  const element = h('div', { class: 'map' });
  const map = L.map(element, { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, zoomControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  // Leaflet fires contextmenu for a long press on touch screens as well as for a right click
  map.on('contextmenu', event => onLongPress({ lat: event.latlng.lat, lon: event.latlng.lng }));

  let marker: L.Marker | null = null;
  let line: L.Polyline | null = null;
  let head: L.Marker | null = null;
  let arrow: { from: LatLon; to: LatLon } | null = null;

  const toLatLng = (p: LatLon) => L.latLng(p.lat, p.lon);

  // The line ends a bit before the destination, so that its blunt end does not stick out from
  // under the tip of the arrow head; the gap is in pixels, so it depends on zoom
  function updateArrow() {
    if (!arrow || !line || !head) return;
    const from = map.latLngToLayerPoint(toLatLng(arrow.from));
    const to = map.latLngToLayerPoint(toLatLng(arrow.to));
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    const end = length > ARROW_TIP_PX
      ? map.layerPointToLatLng(L.point(to.x - dx * ARROW_TIP_PX / length, to.y - dy * ARROW_TIP_PX / length))
      : toLatLng(arrow.to);
    line.setLatLngs([toLatLng(arrow.from), end]);
    const angle = length > 0 ? Math.atan2(dy, dx) * 180 / Math.PI + 90 : 0;
    head.setIcon(L.divIcon({
      className: 'map-icon',
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${ARROW_SIZE}" height="${ARROW_SIZE}"`
        + ` style="transform: rotate(${angle}deg)"><path fill="#f00" d="${ARROW_PATH}"/></svg>`,
      iconSize: [ARROW_SIZE, ARROW_SIZE],
      iconAnchor: [ARROW_SIZE / 2, ARROW_SIZE / 2],
    }));
  }
  map.on('move zoom moveend zoomend', updateArrow);

  const setArrow = (from: LatLon, to: LatLon | null) => {
    line?.remove();
    head?.remove();
    line = null;
    head = null;
    arrow = null;
    if (!to) return;
    arrow = { from, to };
    line = L.polyline([toLatLng(from), toLatLng(to)], { color: '#f00', weight: 3, interactive: false }).addTo(map);
    head = L.marker(toLatLng(to), { icon: START_ICON, interactive: false, zIndexOffset: 1000 }).addTo(map);
    updateArrow();
  };

  return {
    map,
    element,
    ready: () => map.invalidateSize(),
    setPosition(position, icon = 'start') {
      if (marker) marker.remove();
      marker = L.marker(toLatLng(position), { icon: icon === 'start' ? START_ICON : PIN_ICON, interactive: false }).addTo(map);
    },
    setArrow,
    moveTo: position => map.setView(toLatLng(position), POSITION_ZOOM),
    fit: (a, b) => map.fitBounds(L.latLngBounds(toLatLng(a), toLatLng(b)), { padding: [60, 60] }),
    clear() {
      marker?.remove();
      marker = null;
      setArrow({ lat: 0, lon: 0 }, null);
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    },
    destroy: () => map.remove(),
  };
}
