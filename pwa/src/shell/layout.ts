// Layout of the tools whose results scroll: the settings stay at the top, a divider follows and
// only the part below it scrolls, like the ScrollViews of the app

import { h } from './dom';

/** The settings of a tool on their tinted panel, with a divider under it */
export function settingsPanel(...settings: Node[]): Node[] {
  return [h('div', { class: 'panel' }, ...settings), h('hr')];
}

/** Appends the settings panel and a scrolling part to the container; returns the cleanup */
export function fixedTopLayout(container: HTMLElement, top: Node[], scrolling: Node[]): () => void {
  container.classList.add('fill');
  container.append(...settingsPanel(...top), h('div', { class: 'scroll' }, ...scrolling));
  return () => container.classList.remove('fill');
}
