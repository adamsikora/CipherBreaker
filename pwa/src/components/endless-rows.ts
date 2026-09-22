// A list that grows by a batch of rows whenever its end scrolls into view, the counterpart of the
// ScrollView listeners of the app that add 30 rows at the bottom

import { h } from '../shell/dom';

const BATCH = 30;

export interface EndlessRows<R> {
  element: HTMLElement;
  rows: R[];
  /** Stops watching the scrolling, to be called when the tool is left */
  dispose(): void;
}

export function endlessRows<R extends { element: HTMLElement }>(makeRow: (index: number) => R): EndlessRows<R> {
  const rows: R[] = [];
  const list = h('div', { class: 'rows' });
  const sentinel = h('div', { class: 'rows-end' });
  const element = h('div', null, list, sentinel);

  const addBatch = () => {
    for (let i = 0; i < BATCH; i++) {
      const row = makeRow(rows.length);
      rows.push(row);
      list.append(row.element);
    }
  };
  addBatch();

  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) addBatch();
  }, { rootMargin: '200px' });
  // The element is attached to the page only after this returns, the observer copes with that
  observer.observe(sentinel);

  return { element, rows, dispose: () => observer.disconnect() };
}
