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
    const locationText = h('span', null, position ? formatLatLng(position.lat, position.lon) : '');
    const view = mapView(picked => {
      position = picked;
      locationText.textContent = formatLatLng(picked.lat, picked.lon);
      view.setPosition(picked, 'pin');
      toast('Set new starting location');
    });
    // Leaving the tool underneath (browser back) cancels the picking, the overlay would stay
    // otherwise; so does Escape
    const onHashChange = () => close(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(null);
    };
    const close = (result: LatLon | null) => {
      window.removeEventListener('hashchange', onHashChange);
      document.removeEventListener('keydown', onKeyDown);
      view.destroy();
      overlay.remove();
      resolve(result);
    };
    window.addEventListener('hashchange', onHashChange);
    document.addEventListener('keydown', onKeyDown);
    const overlay = h('div', { class: 'overlay' },
      h('div', { class: 'row overlay-bar' },
        h('span', null, 'Location: ', locationText),
        h('span', { style: 'flex: 1' }),
        h('button', { type: 'button', class: 'small', onclick: () => close(null) }, 'Cancel'),
        h('button', { type: 'button', class: 'primary', onclick: () => position ? close(position) : toast('No location selected') }, 'Confirm')),
      view.element);
    document.body.append(overlay);
    // The keyboard focus moves into the overlay with it, like into a dialog
    overlay.tabIndex = -1;
    overlay.focus();
    view.ready();
    if (position) {
      view.setPosition(position, 'pin');
      view.moveTo(position);
    }
  });
}
