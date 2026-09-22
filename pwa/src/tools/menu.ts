import { h, svg } from '../shell/dom';
import { icons } from '../shell/icons';
import { navigate, Tool } from '../shell/router';

export function menuTool(tools: Tool[]): Tool {
  return {
    path: '',
    title: 'Cipher Breaker',
    icon: '',
    mount(container) {
      container.append(h('ul', { class: 'menu' }, ...tools.map(tool =>
        h('li', null, h('a', {
          href: tool.external ?? `#/${tool.path}`,
          target: tool.external ? '_blank' : null,
          rel: tool.external ? 'noopener' : null,
          onclick: (event: Event) => {
            if (tool.external) return;
            event.preventDefault();
            navigate(tool);
          },
        }, svg(icons[tool.icon]), tool.title)))));
    },
  };
}
