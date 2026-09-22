// Dictionary Searcher, port of PresmyslovnikActivity.kt. The search runs in search-worker.ts

import { MODES } from '../logic/dictionary';
import { formatLatLng, parseIntWithDefault } from '../logic/format';
import { h } from '../shell/dom';
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
    let userLocation: { lat: number; lon: number } | null = null;

    const modeSelect = h('select', null, ...MODES.map(mode => h('option', null, mode)));
    const dictionarySelect = h('select', null, ...DICTIONARIES.map(([value, label]) => h('option', { value }, label)));
    const minLengthBox = h('input', { type: 'number', class: 'short', placeholder: 'Min', min: 0 });
    const maxLengthBox = h('input', { type: 'number', class: 'short', placeholder: 'Max', min: 0 });
    const diacriticsBox = h('input', { type: 'checkbox' });
    const positionText = h('span', { class: 'muted' }, 'Position: unknown');
    const locateButton = h('button', { type: 'button', class: 'small' }, 'Current location');
    const positionRow = h('div', { class: 'row hidden' }, positionText, locateButton);
    const queryBox = h('input', {
      type: 'text', placeholder: 'Query', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, style: 'flex: 1; min-width: 200px',
    });
    const goButton = h('button', { type: 'submit', class: 'primary' }, 'Go');
    const countView = h('b', null, '0');
    const timeView = h('b', null, '0.000');
    const loadingView = h('span');
    const progressBar = h('progress', { max: 100, value: 0 });
    const resultView = h('div', { class: 'mono' });

    const form = h('form', { class: 'row' }, queryBox, goButton);
    container.append(
      h('div', { class: 'row' }, h('label', null, 'Mode:', modeSelect), h('label', null, 'Dictionary:', dictionarySelect)),
      h('div', { class: 'row' },
        h('label', { class: 'fixed' }, 'Length:', h('span', { style: 'display: flex; align-items: center; gap: 4px' }, minLengthBox, '-', maxLengthBox)),
        h('label', { class: 'check' }, diacriticsBox, 'Diacritics')),
      positionRow,
      form,
      h('hr'),
      h('div', { class: 'stats' }, h('span', null, 'Count: ', countView), h('span', null, 'Time: ', timeView, ' s'), loadingView),
      progressBar,
      resultView,
    );

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

    function acquireLocation() {
      if (!navigator.geolocation) {
        toast('Geolocation is not available');
        return;
      }
      positionText.textContent = 'Position: acquiring…';
      navigator.geolocation.getCurrentPosition(pos => {
        userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        positionText.textContent = `Position: ${formatLatLng(userLocation.lat, userLocation.lon)}`;
      }, err => {
        positionText.textContent = 'Position: unknown';
        toast('Location not available: ' + err.message);
      }, { enableHighAccuracy: true, timeout: 15000 });
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
      } else if (msg.type === 'toast') {
        if (msg.id === searchId) toast(msg.text);
      } else if (msg.type === 'progress' && msg.id === searchId) {
        progressBar.value = msg.progress;
        countView.textContent = String(msg.count);
        timeView.textContent = msg.time.toFixed(3);
        resultView.textContent = msg.result;
        if (msg.done) {
          progressBar.classList.remove('visible');
          loadingView.textContent = '';
        }
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
    };
  },
};
