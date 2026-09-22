// Dictionary Search, port of PresmyslovnikActivity.kt. The search runs in search-worker.ts

import { MODES } from '../logic/dictionary';
import { formatLatLng, parseIntWithDefault } from '../logic/format';
import { pickFromMap } from '../components/map-picker';
import { queryBox as makeQueryBox } from '../components/query-box';
import { h, svg } from '../shell/dom';
import { icons } from '../shell/icons';
import { fixedTopLayout } from '../shell/layout';
import { acquireLocation as locate, LatLon } from '../shell/location';
import { Tool } from '../shell/router';
import { loadState, saveState } from '../shell/storage';
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
  title: 'Dictionary Search',
  icon: 'dictionary',
  mount(container) {
    const state = loadState(STATE_KEY, DEFAULT_STATE);
    const worker = new Worker(new URL('../workers/search-worker.ts', import.meta.url), { type: 'module' });
    let searchId = 0;
    let userLocation: LatLon | null = null;

    const modeSelect = h('select', null, ...MODES.map(mode => h('option', null, mode)));
    const dictionarySelect = h('select', null, ...DICTIONARIES.map(([value, label]) => h('option', { value }, label)));
    const minLengthBox = h('input', { type: 'number', class: 'short', placeholder: 'Min', min: 0, style: 'width: 3em' });
    const maxLengthBox = h('input', { type: 'number', class: 'short', placeholder: 'Max', min: 0, style: 'width: 3em' });
    const diacriticsBox = h('input', { type: 'checkbox', style: 'width: 20px; height: 20px; margin: 0' });
    const positionText = h('span', { class: 'muted' }, 'Position: unknown');
    const pickButton = h('button', { type: 'button', class: 'icon', 'aria-label': 'Pick from map' }, svg(icons.map));
    const locateButton = h('button', { type: 'button', class: 'icon', 'aria-label': 'Current location' }, svg(icons['my-location']));
    const positionRow = h('div', { class: 'row compact hidden' }, positionText, h('span', { style: 'flex: 1' }), pickButton, locateButton);
    const queryBox = makeQueryBox('Query', 'flex: 1; min-width: 200px', () => searchDictionary());
    const countView = h('b', null, '0');
    const timeView = h('b', null, '0.000');
    // The stats row shows either the counts of the last search, with what was wrong with its input
    // when something was, or the loading of a dictionary. Problems are shown here and not toasted,
    // because searches run while typing and a half-typed query is often invalid
    const loadingView = h('span');
    const messageView = h('span', { class: 'message' });
    const countsView = h('span', { style: 'display: contents' }, h('span', null, 'Count: ', countView), h('span', null, 'Time: ', timeView, ' s'), messageView);
    const statsRow = h('div', { class: 'stats' }, countsView);
    const progressBar = h('progress', { max: 100, value: 0 });
    const resultView = h('div', { class: 'mono' });

    // The search runs as the query is typed, after a short pause; Enter runs it at once
    const SEARCH_DELAY_MS = 300;
    let searchTimer: number | undefined;
    const form = h('div', { class: 'row compact' }, queryBox,
      h('label', { class: 'check', title: 'Diacritics' }, diacriticsBox, h('span', { class: 'accents' }, '´ˇ')));
    const unmountLayout = fixedTopLayout(container, [
      // All the settings in one line like the pickers of Name Days: the selects share
      // the width that the length boxes leave, the modes have longer names than the dictionaries
      h('div', { class: 'row nowrap' },
        h('label', { style: 'flex-grow: 5' }, 'Mode:', modeSelect),
        h('label', { style: 'flex-grow: 4' }, 'Dictionary:', dictionarySelect),
        h('label', { class: 'fixed' }, 'Length:', h('span', { style: 'display: flex; align-items: center; gap: 4px' }, minLengthBox, '-', maxLengthBox))),
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

    // The position arrives after the search that its request set off, so the results are
    // recomputed once it is known
    async function acquireLocation() {
      positionText.textContent = 'Position: acquiring…';
      const location = await locate();
      setLocation(location);
      if (location) scheduleSearch();
    }

    function showResult(count: number, time: number, result: string) {
      countView.textContent = String(count);
      timeView.textContent = time.toFixed(3);
      resultView.textContent = result;
      statsRow.replaceChildren(countsView);
    }

    function searchDictionary() {
      clearTimeout(searchTimer);
      save();
      messageView.textContent = '';
      const minLength = parseIntWithDefault(minLengthBox.value, 0);
      const maxLength = parseIntWithDefault(maxLengthBox.value, Number.MAX_SAFE_INTEGER);
      // Nothing to search for, the last results stay
      if (queryBox.value === '') return;
      if (minLength > maxLength) {
        ++searchId;
        progressBar.classList.remove('visible');
        showResult(0, 0, '');
        messageView.textContent = `Min length (${minLength}) is greater than max length (${maxLength})`;
        return;
      }
      if (isMapChosen() && userLocation === null) acquireLocation();
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

    function scheduleSearch() {
      clearTimeout(searchTimer);
      searchTimer = window.setTimeout(searchDictionary, SEARCH_DELAY_MS);
    }

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.type === 'loading') {
        loadingView.textContent = msg.text;
        statsRow.replaceChildren(loadingView);
      } else if (msg.type === 'toast') {
        if (msg.id === searchId) messageView.textContent = msg.text;
      } else if (msg.type === 'progress' && msg.id === searchId) {
        progressBar.value = msg.progress;
        showResult(msg.count, msg.time, msg.result);
        if (msg.done) progressBar.classList.remove('visible');
      }
    };

    modeSelect.addEventListener('change', () => {
      refreshControls();
      scheduleSearch();
    });
    dictionarySelect.addEventListener('change', () => {
      refreshControls();
      if (isMapChosen() && userLocation === null) acquireLocation();
      // Loading a dictionary takes a while, it starts as soon as it is chosen
      send({ type: 'load', name: dictionarySelect.value, url: assetUrl(dictionarySelect.value) });
      scheduleSearch();
    });
    for (const box of [queryBox, minLengthBox, maxLengthBox]) box.addEventListener('input', scheduleSearch);
    diacriticsBox.addEventListener('change', scheduleSearch);
    locateButton.addEventListener('click', acquireLocation);
    pickButton.addEventListener('click', async () => {
      setLocation(await pickFromMap(userLocation));
      scheduleSearch();
    });
    refreshControls();
    if (isMapChosen()) acquireLocation();
    send({ type: 'load', name: dictionarySelect.value, url: assetUrl(dictionarySelect.value) });
    queryBox.focus();
    // The saved query is searched right away, the loading is awaited by the worker
    if (queryBox.value !== '') scheduleSearch();

    return () => {
      clearTimeout(searchTimer);
      save();
      worker.terminate();
      unmountLayout();
    };
  },
};
