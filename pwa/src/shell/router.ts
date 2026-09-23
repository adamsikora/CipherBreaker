// Hash based routing between the tools: #/ is the menu, #/<path> a tool. A tool mounts into the
// main element and may return what the header needs of it: a function to call when it is left,
// like onDestroy, a reset, and examples that the bulb of the header cycles through

import { toast } from './toast';

export interface Example {
  /** Shown when the example is put in */
  name: string;
  apply(): void;
}

export interface ToolInstance {
  unmount?(): void;
  /** Puts the tool back to its defaults, inputs and results alike */
  reset?(): void;
  examples?: Example[];
}

export interface Tool {
  path: string;
  title: string;
  icon: string;
  /** Opened in the browser instead of mounting, for tools that live elsewhere */
  external?: string;
  mount?(container: HTMLElement): ToolInstance | (() => void) | void;
}

let tools: Tool[] = [];
let menu: Tool | null = null;
let instance: ToolInstance = {};
// Which example each tool shows next, kept while the page lives
const nextExample = new Map<string, number>();

function currentPath(): string {
  const hash = location.hash.replace(/^#\/?/, '');
  return hash.replace(/\/$/, '');
}

function show(tool: Tool): void {
  instance.unmount?.();
  instance = {};
  const main = document.getElementById('main')!;
  main.replaceChildren();
  main.scrollTop = 0;
  document.getElementById('title')!.textContent = tool.title;
  // The menu shows the app icon where the tools show the back arrow
  document.getElementById('back')!.hidden = tool === menu;
  document.getElementById('logo')!.hidden = tool !== menu;
  document.title = tool === menu ? 'Cipher Breaker' : `${tool.title} – Cipher Breaker`;
  const mounted = tool.mount?.(main);
  instance = typeof mounted === 'function' ? { unmount: mounted } : mounted ?? {};
  document.getElementById('example')!.hidden = !instance.examples?.length;
  document.getElementById('reset')!.hidden = !instance.reset;
}

function route(): void {
  const path = currentPath();
  const tool = tools.find(t => t.path === path);
  show(tool && tool.mount ? tool : menu!);
}

export function startRouter(menuTool: Tool, toolList: Tool[]): void {
  menu = menuTool;
  tools = toolList;
  // The arrow always leads to the menu, whatever the history
  document.getElementById('back')!.addEventListener('click', () => {
    location.hash = '#/';
  });
  document.getElementById('reset')!.addEventListener('click', () => instance.reset?.());
  document.getElementById('example')!.addEventListener('click', () => {
    const examples = instance.examples;
    if (!examples?.length) return;
    const path = currentPath();
    const index = (nextExample.get(path) ?? 0) % examples.length;
    examples[index].apply();
    toast(`${examples[index].name} (${index + 1}/${examples.length})`);
    nextExample.set(path, index + 1);
  });
  window.addEventListener('hashchange', route);
  route();
}

/** Opens a tool of the app; an external one is a plain link in the menu */
export function navigate(tool: Tool): void {
  location.hash = `#/${tool.path}`;
}
