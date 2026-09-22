// Useful Links: outside tools that come in handy at a puzzle hunt, opened in the browser

import { h } from '../shell/dom';
import { Tool } from '../shell/router';

const LINKS: [string, string, string][] = [
  ['Sudoku Solver', 'Solves and rates sudoku puzzles', 'https://www.sudoku-solutions.com/'],
  ['Chess board analyzer', 'Sets up a chess position and analyses it', 'https://lichess.org/editor/8/8/8/8/8/8/8/8_w_-_-_0_1?color=white'],
];

export const linksTool: Tool = {
  path: 'links',
  title: 'Useful Links',
  icon: 'link',
  mount(container) {
    container.append(h('ul', { class: 'links' }, ...LINKS.map(([name, description, url]) =>
      h('li', null, h('a', { href: url, target: '_blank', rel: 'noopener' },
        h('b', null, name),
        h('span', { class: 'muted' }, description),
        h('span', { class: 'muted url' }, new URL(url).hostname))))));
  },
};
