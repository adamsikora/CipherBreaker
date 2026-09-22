import { h, svg } from '../shell/dom';
import { icons } from '../shell/icons';
import { Tool } from '../shell/router';

declare const __APP_VERSION__: string;

export const aboutTool: Tool = {
  path: 'about',
  title: 'About',
  icon: 'info',
  mount(container) {
    container.append(h('div', { class: 'about' },
      h('p', null, 'This app was created to help with Puzzle Hunt competitions.'),
      h('p', null, 'Note that it contains powerful tools and usage of some of them might be against the rules of particular Puzzle Hunts.'),
      h('p', null, 'Suggestions or contributions on GitHub are welcome.'),
      h('hr'),
      h('p', null, `Version ${__APP_VERSION__}`),
      h('hr'),
      h('div', { class: 'link' }, svg(icons.email), h('a', { href: 'mailto:adam.sikora73@gmail.com' }, 'adam.sikora73@gmail.com')),
      h('div', { class: 'link' }, svg(icons.github),
        h('a', { href: 'https://github.com/adamsikora/CipherBreaker', target: '_blank', rel: 'noopener' }, 'GitHub repository')),
      h('hr'),
      h('p', { class: 'muted' }, '© Adam Sikora 2023–2026'),
    ));
  },
};
