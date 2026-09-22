// Dictionary Searcher, port of PresmyslovnikActivity.kt. The search runs in search-worker.ts

import { MODES } from '../logic/dictionary';
import { formatLatLng, parseIntWithDefault } from '../logic/format';
import { pickFromMap } from '../components/map-picker';
import { h, svg } from '../shell/dom';
import { icons } from '../shell/icons';
import { fixedTopLayout } from '../shell/layout';
import { acquireLocation as locate, LatLon } from '../shell/location';
import { Tool } from '../shell/router';
import { loadState, saveState } from '../shell/storage';
import { toast } from '../shell/toast';
import type { WorkerRequest, WorkerResponse } from '../workers/search-worker';

const DICTIONARIES: [string, string][] = [
  ['en.cbfcdict', 'EN'],
  ['cs_nouns.cbfcdict', 'CZ nouns'],
  ['cs.cbfcdict', 'CZ'],
  ['Czechia.cbfcmap', 'Czechia'],
];

interface State {
  modeSpinner: number;
  dictionarySpinner: string;
  minLength: string;
  maxLength: string;
  diacritics: boolean;
  query: string;
}

const STATE_KEY = 'dictionary';
const DEFAULT_STATE: State = {
  modeSpinner: 0, dictionarySpinner: DICTIONARIES[0][0], minLength: '', maxLength: '', diacritics: false, query: '',
};

export const dictionaryTool: Tool = {
  path: 'dictionary',
  title: 'Dictionary Searcher',
  icon: 'find-replace',
  mount(container) {
    const state = loadState(STATE_KEY, DEFAULT_STATE);
    const worker = new Worker(new URL('../workers/search-worker.ts', import.meta.url), { type: 'module' });
    let searchId = 0;
    let userLocation: LatLon | null = null;

    const modeSelect = h('select', null, ...MODES.map(mode => h('option', null, mode)));
    const dictionarySelect = h('select', null, ...DICTIONARIES.map(([value, label]) => h('option', { value }, label)));
    const minLengthBox = h('input', { type: 'number', class: 'short', placeholder: 'Min', min: 0, style: 'width: 3em' });
    const maxLengthBox = h('input', { type: 'number', class: 'short', placeholder: 'Max', min: 0, style: 'width: 3em' });
    const diacriticsBox = h('input', { type: 'checkbox', style: 'width: 20px; height: 20px; margin: 9px auto' });
    const positionText = h('span', { class: 'muted' }, 'Position: unknown');
    const pickButton = h('button', { type: 'button', class: 'icon', 'aria-label': 'Pick from map' }, svg(icons.map));
    const locateButton = h('button', { type: 'button', class: 'icon', 'aria-label': 'Current location' }, svg(icons['my-location']));
    const positionRow = h('div', { class: 'row compact hidden' }, positionText, h('span', { style: 'flex: 1' }), pickButton, locateButton);
    const queryBox = h('input', {
      type: 'text', placeholder: 'Query', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, style: 'flex: 1; min-width: 200px',
    });
    const goButton = h('button', { type: 'submit', class: 'primary' }, 'Go');
    const countView = h('b', null, '0');
    const timeView = h('b', null, '0.000');
    // The stats row shows either the counts of the last search or the loading of a dictionary
    const loadingView = h('span');
    const countsView = h('span', { style: 'display: contents' }, h('span', null, 'Count: ', countView), h('span', null, 'Time: ', timeView, ' s'));
    const statsRow = h('div', { class: 'stats' }, countsView);
    const progressBar = h('progress', { max: 100, value: 0 });
    const resultView = h('div', { class: 'mono' });

    const form = h('form', { class: 'row compact' }, queryBox, goButton);
    const unmountLayout = fixedTopLayout(container, [
      // All the settings in one line like the pickers of the Name Day Searcher: the selects share
      // the width that the length boxes and the checkbox leave
      h('div', { class: 'row nowrap' },
        h('label', null, 'Mode:', modeSelect),
        h('label', null, 'Dictionary:', dictionarySelect),
        h('label', { class: 'fixed' }, 'Length:', h('span', { style: 'display: flex; align-items: center; gap: 4px' }, minLengthBox, '-', maxLengthBox)),
        h('label', { class: 'fixed centered', title: 'Diacritics' }, h('span', { class: 'accents' }, '´ˇ'), diacriticsBox)),
      positionRow,
      form,
      statsRow,
      progressBar,
    ], [resultView]);

    modeSelect.selectedIndex = state.modeSpinner;
    if (DICTIONARIES.some(([value]) => value === state.dictionarySpinner)) dictionarySelect.value = state.dictionarySpinner;
    minLengthBox.value = state.minLength;
    maxLengthBox.value = state.maxLength;
    diacriticsBox.checked = state.diacritics;
    queryBox.value = state.query;

    const isMapChosen = () => dictionarySelect.value.endsWith('.cbfcmap');
    const assetUrl = (name: string) => new URL(`assets/${name}`, document.baseURI).href;
    const send = (message: WorkerRequest) => worker.postMessage(message);

    function refreshControls() {
      const mode = modeSelect.selectedIndex;
      // Only Regex, Hamming and Levenshtein can be sensitive to diacritics
      diacriticsBox.disabled = !(mode === 0 || mode === 4 || mode === 5);
      queryBox.inputMode = mode >= 6 ? 'numeric' : 'text';
      positionRow.classList.toggle('hidden', !isMapChosen());
    }

    function save() {
      saveState(STATE_KEY, {
        modeSpinner: modeSelect.selectedIndex,
        dictionarySpinner: dictionarySelect.value,
        minLength: minLengthBox.value,
        maxLength: maxLengthBox.value,
        diacritics: diacriticsBox.checked,
        query: queryBox.value,
      } satisfies State);
    }

    function setLocation(location: LatLon | null) {
      if (location) userLocation = location;
      positionText.textContent = userLocation ? `Position: ${formatLatLng(userLocation.lat, userLocation.lon)}` : 'Position: unknown';
    }

    async function acquireLocation() {
      positionText.textContent = 'Position: acquiring…';
      setLocation(await locate());
    }

    function searchDictionary() {
      const minLength = parseIntWithDefault(minLengthBox.value, 0);
      const maxLength = parseIntWithDefault(maxLengthBox.value, Number.MAX_SAFE_INTEGER);
      if (minLength > maxLength) {
        toast(`Min length (${minLength}) is greater than max length (${maxLength}). Aborting calculation`);
        return;
      }
      if (isMapChosen() && userLocation === null) acquireLocation();
      save();
      progressBar.value = 0;
      progressBar.classList.add('visible');
      send({
        type: 'search',
        id: ++searchId,
        name: dictionarySelect.value,
        url: assetUrl(dictionarySelect.value),
        input: queryBox.value.toLowerCase(),
        params: { modeId: modeSelect.selectedIndex, minLength, maxLength, diacritics: !diacriticsBox.disabled && diacriticsBox.checked },
        location: userLocation,
      });
    }

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.type === 'loading') {
        loadingView.textContent = msg.text;
        statsRow.replaceChildren(loadingView);
      } else if (msg.type === 'toast') {
        if (msg.id === searchId) toast(msg.text);
      } else if (msg.type === 'progress' && msg.id === searchId) {
        progressBar.value = msg.progress;
        countView.textContent = String(msg.count);
        timeView.textContent = msg.time.toFixed(3);
        resultView.textContent = msg.result;
        statsRow.replaceChildren(countsView);
        if (msg.done) progressBar.classList.remove('visible');
      }
    };

    modeSelect.addEventListener('change', refreshControls);
    dictionarySelect.addEventListener('change', () => {
      refreshControls();
      if (isMapChosen() && userLocation === null) acquireLocation();
      // Loading a dictionary takes a while, it starts as soon as it is chosen
      send({ type: 'load', name: dictionarySelect.value, url: assetUrl(dictionarySelect.value) });
    });
    locateButton.addEventListener('click', acquireLocation);
    pickButton.addEventListener('click', async () => setLocation(await pickFromMap(userLocation)));
    form.addEventListener('submit', event => {
      event.preventDefault();
      searchDictionary();
    });

    refreshControls();
    send({ type: 'load', name: dictionarySelect.value, url: assetUrl(dictionarySelect.value) });
    queryBox.focus();

    return () => {
      save();
      worker.terminate();
      unmountLayout();
    };
  },
};
