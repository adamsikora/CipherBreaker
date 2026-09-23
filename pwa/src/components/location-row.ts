// The row showing the location of the user with the buttons that set it, shared by the map
// search of the Dictionary Search and the Azimuth Calculator

import { h } from '../shell/dom';

export function locationRow(text: HTMLElement, ...buttons: HTMLElement[]): HTMLElement {
  return h('div', { class: 'row compact' }, text, h('span', { class: 'spacer' }), ...buttons);
}
