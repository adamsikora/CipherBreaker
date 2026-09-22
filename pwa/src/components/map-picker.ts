// Picking a position on a map, the counterpart of PickFromMapActivity: a full screen overlay
// that resolves with the position confirmed, or null when cancelled

import { formatLatLng } from '../logic/format';
import { h } from '../shell/dom';
import { LatLon } from '../shell/location';
import { toast } from '../shell/toast';
import { mapView } from './map-view';

export function pickFromMap(initial: LatLon | null): Promise<LatLon | null> {
  return new Promise(resolve => {
    let position = initial;
    const positionText = h('span', null, position ? formatLatLng(position.lat, position.lon) : '');
    const view = mapView(picked => {
      position = picked;
      positionText.textContent = formatLatLng(picked.lat, picked.lon);
      view.setPosition(picked, 'pin');
      toast('Set new starting location');
    });
    const close = (result: LatLon | null) => {
      view.destroy();
      overlay.remove();
      resolve(result);
    };
    const overlay = h('div', { class: 'overlay' },
      h('div', { class: 'row overlay-bar' },
        h('span', null, 'Position: ', positionText),
        h('span', { style: 'flex: 1' }),
        h('button', { type: 'button', class: 'small', onclick: () => close(null) }, 'Cancel'),
        h('button', { type: 'button', class: 'primary', onclick: () => position ? close(position) : toast('No position selected') }, 'Confirm')),
      view.element);
    document.body.append(overlay);
    view.ready();
    if (position) {
      view.setPosition(position, 'pin');
      view.moveTo(position);
    }
  });
}
