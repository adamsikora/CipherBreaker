// Small helper for building views without a framework: h('button', { class: 'primary', onclick }, 'Go')

type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, attrs?: Record<string, unknown> | null, ...children: Child[]): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (attrs) {
    for (const [name, value] of Object.entries(attrs)) {
      if (value === null || value === undefined) continue;
      // false leaves an attribute out, but is assigned to a property (spellcheck: false)
      if (value === false && !(name in element)) continue;
      if (name === 'class') element.className = String(value);
      else if (name === 'html') element.innerHTML = String(value);
      else if (name.startsWith('on') && typeof value === 'function') {
        element.addEventListener(name.slice(2), value as EventListener);
      } else if (name in element && typeof value !== 'string') {
        (element as unknown as Record<string, unknown>)[name] = value;
      } else {
        element.setAttribute(name, String(value));
      }
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child);
  }
  return element;
}

/** An SVG icon as an element, from the icons module */
export function svg(markup: string): SVGElement {
  const template = document.createElement('template');
  template.innerHTML = markup;
  return template.content.firstElementChild as SVGElement;
}

export function clear(element: HTMLElement): void {
  element.replaceChildren();
}
