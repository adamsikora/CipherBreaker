// Azimuth Calculator, port of AzimutherActivity.kt: the point reached from a start position after
// given distance under given azimuth, drawn on the map as an arrow

import { locationRow } from '../components/location-row';
import { mapView } from '../components/map-view';
import { destination } from '../logic/azimuth';
import { formatCoord, formatLatLng } from '../logic/format';
import { h, svg } from '../shell/dom';
import { icons } from '../shell/icons';
import { settingsPanel } from '../shell/layout';
import { acquireLocation, LatLon } from '../shell/location';
import { Tool } from '../shell/router';
import { loadState, saveState } from '../shell/storage';
import { copyToClipboard, toast } from '../shell/toast';

// Saved start location and inputs; the location is null until one is set
interface State {
  lat: number | null;
  lon: number | null;
  distance: string;
  angle: string;
}

const STATE_KEY = 'azimuth';
const DEFAULT_STATE: State = { lat: null, lon: null, distance: '', angle: '' };

export const azimuthTool: Tool = {
  path: 'azimuth',
  title: 'Azimuth Calculator',
  icon: 'explore',
  mount(container) {
    let position: LatLon | null = null;
    let target: LatLon | null = null;
    // Set when the tool is left: a location that arrives afterwards must not touch the removed map
    let disposed = false;

    const distanceBox = h('input', { type: 'search', class: 'short', placeholder: 'm', inputmode: 'decimal' });
    // The dial pad has the minus sign that the decimal keyboard lacks, for angles like -90
    const angleBox = h('input', { type: 'search', class: 'short', placeholder: '°', inputmode: 'tel' });
    const locationText = h('span');
    const resultText = h('span');
    const state = loadState(STATE_KEY, DEFAULT_STATE);
    const save = () => saveState(STATE_KEY, {
      lat: position?.lat ?? null, lon: position?.lon ?? null, distance: distanceBox.value, angle: angleBox.value,
    } satisfies State);

    const view = mapView(picked => {
      setLatLon(picked, false);
      toast('Set new starting location');
    });

    const getNumber = (box: HTMLInputElement) => box.value.trim() === '' ? NaN : Number(box.value);

    function setLocation(move: boolean) {
      if (!position) return;
      locationText.textContent = formatLatLng(position.lat, position.lon);
      const dist = getNumber(distanceBox);
      const angle = getNumber(angleBox);
      view.setPosition(position);
      if (!Number.isNaN(dist) && !Number.isNaN(angle)) {
        const [lat, lon] = destination(position.lat, position.lon, dist, angle);
        target = { lat, lon };
        resultText.textContent = formatLatLng(lat, lon);
        // Tip of the arrow marks the destination
        view.setArrow(position, target);
        if (move) view.fit(position, target);
      } else {
        view.setArrow(position, null);
        if (move) view.moveTo(position);
      }
    }

    function setLatLon(latLon: LatLon, move: boolean) {
      position = latLon;
      setLocation(move);
      save();
    }

    /** Puts in a saved state, an example or the defaults */
    function applyState(s: State) {
      distanceBox.value = s.distance;
      angleBox.value = s.angle;
      if (s.lat !== null && s.lon !== null) {
        setLatLon({ lat: s.lat, lon: s.lon }, true);
      } else {
        position = null;
        target = null;
        locationText.textContent = '';
        resultText.textContent = '';
        view.clear();
        save();
      }
    }

    const onEdit = () => {
      if (position) setLocation(true);
      else toast('Set starting location either by clicking in map or by getting your current location');
    };
    for (const box of [distanceBox, angleBox]) {
      box.addEventListener('input', save);
      box.addEventListener('change', onEdit);
      box.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          box.blur();
          onEdit();
        }
      });
    }

    const copyDestination = () => {
      if (target) copyToClipboard('Coordinates', formatLatLng(target.lat, target.lon));
      else toast('Destination not set');
    };
    const openInMapy = () => {
      if (!target) {
        toast('Destination not set');
        return;
      }
      const lat = formatCoord(target.lat);
      const lon = formatCoord(target.lon);
      window.open(`https://en.mapy.cz/zakladni?x=${lon}&y=${lat}&z=17&source=coor&id=${lon}%2C${lat}`, '_blank', 'noopener');
    };

    container.classList.add('fill');
    container.append(...settingsPanel(
      h('div', { class: 'row compact' },
        h('label', { class: 'check' }, 'Distance:', distanceBox),
        h('label', { class: 'check' }, 'Angle:', angleBox)),
      locationRow(h('span', null, 'Location: ', locationText),
        h('button', { type: 'button', class: 'icon', 'aria-label': 'Current location', onclick: async () => {
          const location = await acquireLocation();
          if (location && !disposed) setLatLon(location, true);
        } }, svg(icons['my-location']))),
      h('div', { class: 'row compact' },
        h('span', { onclick: copyDestination, style: 'cursor: pointer' }, 'Destination: ', resultText),
        h('span', { class: 'spacer' }),
        h('button', { type: 'button', class: 'icon', 'aria-label': 'Copy to clipboard', onclick: copyDestination }, svg(icons.clipboard)),
        h('button', { type: 'button', class: 'icon', 'aria-label': 'Open in mapy.cz', onclick: openInMapy },
          h('img', { src: 'mapy_cz.png', alt: '' }))),
    ), view.element);
    view.ready();
    applyState(state);

    return {
      unmount() {
        disposed = true;
        save();
        view.destroy();
        container.classList.remove('fill');
      },
      reset: () => applyState(DEFAULT_STATE),
      examples: [
        { name: 'Prague, Old Town Square: 500 m to the north-east', apply: () => applyState({ lat: 50.08750, lon: 14.42120, distance: '500', angle: '45' }) },
        { name: 'Brno, Špilberk: 1200 m to the west', apply: () => applyState({ lat: 49.19444, lon: 16.59917, distance: '1200', angle: '270' }) },
        { name: 'Sněžka: 3 km due south', apply: () => applyState({ lat: 50.73611, lon: 15.73972, distance: '3000', angle: '180' }) },
      ],
    };
  },
};
