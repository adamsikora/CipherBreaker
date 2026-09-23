// The query input of the searchers, the same in every tool: a plain keyboard without
// autocorrection or capitals, whose Enter key is a Search key on phones that runs the search
// and puts the keyboard away. The type is search like on every text box of the app: Chrome on
// Android puts its passwords/payments/addresses bar over the keyboard for any other text input

import { h } from '../shell/dom';

export function queryBox(placeholder: string, style: string, search: () => void): HTMLInputElement {
  const box = h('input', {
    type: 'search', placeholder, autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: false,
    enterkeyhint: 'search', style,
  });
  box.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    box.blur();
    search();
  });
  return box;
}
