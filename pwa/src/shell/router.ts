// Hash based routing between the tools: #/ is the menu, #/<path> a tool. A tool mounts into the
// main element and may return a function that is called when it is left, like onDestroy

export interface Tool {
  path: string;
  title: string;
  icon: string;
  /** Opened in the browser instead of mounting, for tools that live elsewhere */
  external?: string;
  mount?(container: HTMLElement): (() => void) | void;
}

let tools: Tool[] = [];
let menu: Tool | null = null;
let unmount: (() => void) | void;

function currentPath(): string {
  const hash = location.hash.replace(/^#\/?/, '');
  return hash.replace(/\/$/, '');
}

function show(tool: Tool): void {
  if (unmount) unmount();
  unmount = undefined;
  const main = document.getElementById('main')!;
  main.replaceChildren();
  main.scrollTop = 0;
  document.getElementById('title')!.textContent = tool.title;
  document.getElementById('back')!.hidden = tool === menu;
  document.title = tool === menu ? 'Cipher Breaker' : `${tool.title} – Cipher Breaker`;
  unmount = tool.mount?.(main);
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
  window.addEventListener('hashchange', route);
  route();
}

export function navigate(tool: Tool): void {
  if (tool.external) {
    window.open(tool.external, '_blank', 'noopener');
  } else {
    location.hash = `#/${tool.path}`;
  }
}
