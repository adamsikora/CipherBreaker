// Azimuth Calculator, port of AzimutherActivity.kt: the point reached from a start position after
// given distance under given azimuth, drawn on the map as an arrow

import { mapView } from '../components/map-view';
import { destination } from '../logic/azimuth';
import { formatCoord, formatLatLng } from '../logic/format';
import { h, svg } from '../shell/dom';
import { icons } from '../shell/icons';
import { settingsPanel } from '../shell/layout';
import { acquireLocation, LatLon } from '../shell/location';
import { Tool } from '../shell/router';
import { copyToClipboard, toast } from '../shell/toast';

export const azimuthTool: Tool = {
  path: 'azimuth',
  title: 'Azimuth Calculator',
  icon: 'explore',
  mount(container) {
    let position: LatLon | null = null;
    let target: LatLon | null = null;

    const distanceBox = h('input', { type: 'number', class: 'short', placeholder: 'm', inputmode: 'decimal', step: 'any' });
    const angleBox = h('input', { type: 'number', class: 'short', placeholder: '°', inputmode: 'decimal', step: 'any' });
    const positionText = h('span');
    const resultText = h('span');

    const view = mapView(picked => {
      setLatLon(picked, false);
      toast('Set new starting location');
    });

    const getNumber = (box: HTMLInputElement) => box.value.trim() === '' ? NaN : Number(box.value);

    function setLocation(move: boolean) {
      if (!position) return;
      positionText.textContent = formatLatLng(position.lat, position.lon);
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
    }

    const onEdit = () => {
      if (position) setLocation(true);
      else toast('Set starting location either by clicking in map or by getting your current location');
    };
    for (const box of [distanceBox, angleBox]) {
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
      h('div', { class: 'row compact' },
        h('span', null, 'Position: ', positionText),
        h('span', { style: 'flex: 1' }),
        h('button', { type: 'button', class: 'icon', 'aria-label': 'Current location', onclick: async () => {
          const location = await acquireLocation();
          if (location) setLatLon(location, true);
        } }, svg(icons['my-location']))),
      h('div', { class: 'row compact' },
        h('span', { onclick: copyDestination, style: 'cursor: pointer' }, 'Destination: ', resultText),
        h('span', { style: 'flex: 1' }),
        h('button', { type: 'button', class: 'icon', 'aria-label': 'Copy to clipboard', onclick: copyDestination }, svg(icons.clipboard)),
        h('button', { type: 'button', class: 'icon', 'aria-label': 'Open in mapy.cz', onclick: openInMapy },
          h('img', { src: 'mapy_cz.png', alt: '' }))),
    ), view.element);
    view.ready();

    return () => {
      view.destroy();
      container.classList.remove('fill');
    };
  },
};
