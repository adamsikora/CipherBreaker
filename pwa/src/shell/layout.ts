// Layout of the tools whose results scroll: the settings stay at the top, a divider follows and
// only the part below it scrolls, like the ScrollViews of the app

import { h } from './dom';

/** Appends the top part, a divider and a scrolling part to the container; returns the cleanup */
export function fixedTopLayout(container: HTMLElement, top: Node[], scrolling: Node[]): () => void {
  container.classList.add('fill');
  container.append(...top, h('hr'), h('div', { class: 'scroll' }, ...scrolling));
  return () => container.classList.remove('fill');
}
