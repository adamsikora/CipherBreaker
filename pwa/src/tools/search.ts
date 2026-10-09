// Search, made for the PWA: a long text is pasted into a field that fills the screen and searched
// for the comma separated words of a query, each highlighted in a colour of its own. Diacritics,
// case, whitespace and punctuation are ignored, so a word is found across the words of the text

import { queryBox as makeQueryBox } from '../components/query-box';
import { countMatches, findMatches, highlightRuns, parseTerms, searchText, TextMatch } from '../logic/text-search';
import { h, svg } from '../shell/dom';
import { icons } from '../shell/icons';
import { settingsPanel } from '../shell/layout';
import { Tool } from '../shell/router';
import { loadState, saveState } from '../shell/storage';

interface State {
  searchText: string;
  searchQuery: string;
  /** The size of the letters of the text, in pixels */
  searchZoom: number;
}

const STATE_KEY = 'search';
const DEFAULT_STATE: State = { searchText: '', searchQuery: '', searchZoom: 16 };

const MIN_ZOOM = 8;
const MAX_ZOOM = 64;
const ZOOM_STEP = 1.15;
// The colours of the style sheet, hl-0 and on; more terms take them again from the first
const COLOR_COUNT = 8;
// A short word of a query is found many times in a long text, and every match is an element
const MAX_MATCHES = 5000;
const SAVE_DELAY_MS = 500;

const EXAMPLE_TEXT = 'Na stole pes neleží, ale v kose lze najít i jiná zvířata:\npod lípou stál osel a díval se, jak rak letí k vodě.';

export const searchTool: Tool = {
  path: 'search',
  title: 'Search',
  icon: 'search',
  mount(container) {
    const queryBox = makeQueryBox('Words, comma separated', 'flex: 1; min-width: 0', () => step(1));
    // The text is typed and pasted into a transparent box that lies over a copy of it, which has
    // the highlights: a text box cannot colour parts of its text itself
    const textBox = h('textarea', {
      class: 'search-text', placeholder: 'Text to search', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, 'aria-label': 'Text to search',
    });
    const backdrop = h('div', { class: 'search-backdrop', 'aria-hidden': 'true' });
    const field = h('div', { class: 'search-field' }, backdrop, textBox);
    const positionView = h('span', { class: 'muted search-position' });
    const termsView = h('div', { class: 'search-terms' });
    const button = (icon: string, label: string, onclick: () => void) => h('button', { type: 'button', class: 'icon', 'aria-label': label, title: label, onclick }, svg(icons[icon]));
    const previousButton = button('up', 'Previous match', () => step(-1));
    const nextButton = button('down', 'Next match', () => step(1));

    let zoom = DEFAULT_STATE.searchZoom;
    let matches: TextMatch[] = [];
    // The highlighted parts of the copy, in the order of the text
    let marks: { start: number; end: number; element: HTMLElement }[] = [];
    // The match the navigation is at, none before the first step
    let current = -1;
    let saveTimer: number | undefined;

    function save() {
      window.clearTimeout(saveTimer);
      saveTimer = undefined;
      saveState(STATE_KEY, { searchText: textBox.value, searchQuery: queryBox.value, searchZoom: Math.round(zoom) } satisfies State);
    }

    /** The text may be long and is saved whole, so not with every letter typed */
    function scheduleSave() {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(save, SAVE_DELAY_MS);
    }

    /** How many matches there are, with the place of the one the navigation is at once it is at one */
    function showPosition() {
      const total = matches.length >= MAX_MATCHES ? `${MAX_MATCHES}+` : String(matches.length);
      positionView.textContent = termsView.childElementCount === 0 ? '' : current === -1 ? total : `${current + 1} / ${total}`;
      previousButton.disabled = nextButton.disabled = matches.length === 0;
    }

    function syncScroll() {
      backdrop.scrollTop = textBox.scrollTop;
      backdrop.scrollLeft = textBox.scrollLeft;
    }

    /** Searches the text for the terms of the query and highlights what is found */
    function update() {
      const text = textBox.value;
      const terms = parseTerms(queryBox.value);
      matches = findMatches(searchText(text), terms, MAX_MATCHES);
      current = -1;

      const nodes: (Node | string)[] = [];
      let at = 0;
      marks = highlightRuns(matches).map(run => {
        if (run.start > at) nodes.push(text.slice(at, run.start));
        const element = h('span', { class: `search-mark hl-${run.term % COLOR_COUNT}` }, text.slice(run.start, run.end));
        nodes.push(element);
        at = run.end;
        return { start: run.start, end: run.end, element };
      });
      // A text box shows an empty line after a line break at its end, the copy needs one more for it
      nodes.push(text.slice(at) + '\n');
      backdrop.replaceChildren(...nodes);
      syncScroll();

      const counts = countMatches(matches, terms.length);
      termsView.replaceChildren(...terms.map((term, i) => h('button', {
        type: 'button', class: `search-term hl-${i % COLOR_COUNT}`, title: `Next ${term}`, disabled: counts[i] === 0, onclick: () => stepTerm(i),
      }, term, h('b', null, String(counts[i])))));
      showPosition();
    }

    /** Goes to a match: marks it and scrolls the text so that it is in the upper part of the field */
    function goTo(index: number) {
      current = index;
      const match = matches[index];
      let first: HTMLElement | null = null;
      for (const mark of marks) {
        const inside = mark.start >= match.start && mark.end <= match.end;
        mark.element.classList.toggle('current', inside);
        if (inside && !first) first = mark.element;
      }
      if (first) {
        textBox.scrollTop = Math.max(0, first.offsetTop - textBox.clientHeight / 3);
        syncScroll();
      }
      showPosition();
    }

    /** To the next or the previous match, from the last one on to the first and the other way */
    function step(by: number) {
      if (matches.length === 0) return;
      goTo(current === -1 ? (by > 0 ? 0 : matches.length - 1) : (current + by + matches.length) % matches.length);
    }

    /** To the next match of one of the terms */
    function stepTerm(term: number) {
      for (let i = 1; i <= matches.length; i++) {
        const index = (Math.max(current, -1) + i) % matches.length;
        if (matches[index].term === term) {
          goTo(index);
          return;
        }
      }
    }

    function setZoom(size: number) {
      zoom = Math.min(Math.max(size, MIN_ZOOM), MAX_ZOOM);
      field.style.setProperty('--search-size', `${zoom}px`);
      scheduleSave();
    }

    // The text is zoomed by two fingers on it and by the wheel with Ctrl, which is also what a
    // pinch on a touchpad comes as
    let pinch: { distance: number; zoom: number } | null = null;
    const touchDistance = (event: TouchEvent) => Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY);
    textBox.addEventListener('touchstart', event => {
      pinch = event.touches.length === 2 ? { distance: touchDistance(event), zoom } : null;
    }, { passive: true });
    textBox.addEventListener('touchmove', event => {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      setZoom(pinch.zoom * touchDistance(event) / pinch.distance);
    }, { passive: false });
    textBox.addEventListener('touchend', () => { pinch = null; });
    textBox.addEventListener('wheel', event => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setZoom(zoom * (event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP));
    }, { passive: false });

    textBox.addEventListener('scroll', syncScroll);
    textBox.addEventListener('input', () => { update(); scheduleSave(); });
    queryBox.addEventListener('input', () => { update(); scheduleSave(); });

    /** Puts in a saved state, an example or the defaults */
    function applyState(s: State) {
      textBox.value = s.searchText;
      queryBox.value = s.searchQuery;
      setZoom(Number.isFinite(s.searchZoom) ? s.searchZoom : DEFAULT_STATE.searchZoom);
      textBox.scrollTop = 0;
      update();
      save();
    }

    container.classList.add('fill');
    container.append(
      ...settingsPanel(
        h('div', { class: 'search-bar' },
          queryBox,
          positionView,
          previousButton,
          nextButton),
        termsView,
      ),
      field,
    );
    applyState(loadState(STATE_KEY, DEFAULT_STATE));

    return {
      unmount() {
        save();
        container.classList.remove('fill');
      },
      reset: () => applyState(DEFAULT_STATE),
      examples: [
        { name: 'Animals hidden across the words', apply: () => applyState({ searchText: EXAMPLE_TEXT, searchQuery: 'pes, lev, kos, los, osel, rak', searchZoom: Math.round(zoom) }) },
        { name: 'A phrase regardless of spaces and diacritics', apply: () => applyState({ searchText: EXAMPLE_TEXT, searchQuery: 'jina zvirata, stálosel', searchZoom: Math.round(zoom) }) },
      ],
    };
  },
};
