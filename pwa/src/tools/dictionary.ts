// Dictionary Search, port of PresmyslovnikActivity.kt. The search runs in search-worker.ts

import { MODES } from '../logic/dictionary';
import { formatLatLng, parseIntWithDefault } from '../logic/format';
import { locationRow as makeLocationRow } from '../components/location-row';
import { pickFromMap } from '../components/map-picker';
import { queryBox as makeQueryBox } from '../components/query-box';
import { h, svg } from '../shell/dom';
import { icons } from '../shell/icons';
import { fixedTopLayout } from '../shell/layout';
import { acquireLocation as locate, LatLon } from '../shell/location';
import { Example, Tool } from '../shell/router';
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

// One worker for the life of the page: it keeps the dictionaries it has loaded, so that coming
// back to the tool, or to a dictionary, does not load them again. Searches are numbered across
// the visits, so that a response to a search of a previous visit is never taken for a new one
let worker: Worker | null = null;
let searchId = 0;

function searchWorker(): Worker {
  worker ??= new Worker(new URL('../workers/search-worker.ts', import.meta.url), { type: 'module' });
  return worker;
}

export const dictionaryTool: Tool = {
  path: 'dictionary',
  title: 'Dictionary Search',
  icon: 'dictionary',
  mount(container) {
    const state = loadState(STATE_KEY, DEFAULT_STATE);
    const worker = searchWorker();
    let userLocation: LatLon | null = null;

    const modeSelect = h('select', null, ...MODES.map(mode => h('option', null, mode)));
    const dictionarySelect = h('select', null, ...DICTIONARIES.map(([value, label]) => h('option', { value }, label)));
    const minLengthBox = h('input', { type: 'search', inputmode: 'numeric', class: 'short', placeholder: 'Min', style: 'width: 3em' });
    const maxLengthBox = h('input', { type: 'search', inputmode: 'numeric', class: 'short', placeholder: 'Max', style: 'width: 3em' });
    const diacriticsBox = h('input', { type: 'checkbox', 'aria-label': 'Diacritics', style: 'width: 20px; height: 20px; margin: 0' });
    const locationText = h('span', { class: 'muted' }, 'Location: unknown');
    const pickButton = h('button', { type: 'button', class: 'icon', 'aria-label': 'Pick from map' }, svg(icons.map));
    const locateButton = h('button', { type: 'button', class: 'icon', 'aria-label': 'Current location' }, svg(icons['my-location']));
    const locationRow = makeLocationRow(locationText, pickButton, locateButton);
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
      locationRow,
      form,
      statsRow,
    ], [resultView]);


    const isMapChosen = () => dictionarySelect.value.endsWith('.cbfcmap');
    const assetUrl = (name: string) => new URL(`assets/${name}`, document.baseURI).href;
    const send = (message: WorkerRequest) => worker.postMessage(message);

    function refreshControls() {
      const mode = modeSelect.selectedIndex;
      // Only Regex, Hamming and Levenshtein can be sensitive to diacritics
      diacriticsBox.disabled = !(mode <= 2);
      queryBox.inputMode = mode >= 6 ? 'numeric' : 'text';
      locationRow.classList.toggle('hidden', !isMapChosen());
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
      locationText.textContent = userLocation ? `Location: ${formatLatLng(userLocation.lat, userLocation.lon)}` : 'Location: unknown';
    }

    // Set when the tool is left, so that the outcome of a pending request is dropped
    let disposed = false;
    // One request at a time: every search while the location is unknown asks for it, and the
    // searches come with the keystrokes. The location arrives after the search that its request
    // set off, so the results are recomputed once it is known
    let locating: Promise<void> | null = null;
    function acquireLocation(): Promise<void> {
      if (!locating) {
        locationText.textContent = 'Location: acquiring…';
        locating = locate().then(location => {
          locating = null;
          if (disposed) return;
          setLocation(location);
          if (location) scheduleSearch();
        });
      }
      return locating;
    }

    function showResult(count: number, time: number, result: string) {
      countView.textContent = String(count);
      timeView.textContent = time.toFixed(3);
      resultView.textContent = result;
      statsRow.replaceChildren(countsView);
    }

    /** Empties the results and the stats, and drops a search that may be running */
    function clearResults() {
      ++searchId;
      messageView.textContent = '';
      showResult(0, 0, '');
    }

    /** Has the chosen dictionary loaded and searched, the results of the previous one go either way */
    function dictionaryChosen() {
      if (isMapChosen() && userLocation === null) acquireLocation();
      // Loading a dictionary takes a while, it starts as soon as it is chosen
      send({ type: 'load', name: dictionarySelect.value, url: assetUrl(dictionarySelect.value) });
      searchDictionary();
    }

    /** Puts in a saved state, an example or the defaults */
    function applyState(s: State) {
      modeSelect.selectedIndex = Math.min(Math.max(s.modeSpinner, 0), MODES.length - 1);
      dictionarySelect.value = DICTIONARIES.some(([value]) => value === s.dictionarySpinner) ? s.dictionarySpinner : DEFAULT_STATE.dictionarySpinner;
      minLengthBox.value = s.minLength;
      maxLengthBox.value = s.maxLength;
      diacriticsBox.checked = s.diacritics;
      queryBox.value = s.query;
      refreshControls();
      dictionaryChosen();
    }

    function searchDictionary() {
      clearTimeout(searchTimer);
      save();
      messageView.textContent = '';
      const minLength = parseIntWithDefault(minLengthBox.value, 0);
      const maxLength = parseIntWithDefault(maxLengthBox.value, Number.MAX_SAFE_INTEGER);
      // Nothing to search for, nothing to show
      if (queryBox.value === '') {
        clearResults();
        return;
      }
      if (minLength > maxLength) {
        clearResults();
        messageView.textContent = `Min length (${minLength}) is greater than max length (${maxLength})`;
        return;
      }
      if (isMapChosen() && userLocation === null) acquireLocation();
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
        // The dictionary is named as in the list, not by its file
        const label = DICTIONARIES.find(([file]) => file === msg.name)?.[1] ?? msg.name;
        loadingView.textContent = msg.state === 'done' ? `${msg.entries} entries loaded in ${msg.seconds.toFixed(2)} s`
          : msg.state === 'started' ? `Loading ${label}…` : `Cannot load ${label}`;
        statsRow.replaceChildren(loadingView);
      } else if (msg.type === 'toast') {
        if (msg.id === searchId) messageView.textContent = msg.text;
      } else if (msg.type === 'progress' && msg.id === searchId) {
        // The searches are quick, the results coming in are all the progress shown
        showResult(msg.count, msg.time, msg.result);
      }
    };

    modeSelect.addEventListener('change', () => {
      refreshControls();
      scheduleSearch();
    });
    dictionarySelect.addEventListener('change', () => {
      refreshControls();
      dictionaryChosen();
    });
    for (const box of [queryBox, minLengthBox, maxLengthBox]) box.addEventListener('input', scheduleSearch);
    diacriticsBox.addEventListener('change', scheduleSearch);
    locateButton.addEventListener('click', acquireLocation);
    pickButton.addEventListener('click', async () => {
      const picked = await pickFromMap(userLocation);
      if (disposed) return;
      setLocation(picked);
      scheduleSearch();
    });
    // The saved query is searched right away, the loading is awaited by the worker
    applyState(state);
    queryBox.focus();

    const example = (name: string, s: Partial<State>): Example => ({ name, apply: () => applyState({ ...DEFAULT_STATE, ...s }) });
    return {
      unmount() {
        disposed = true;
        clearTimeout(searchTimer);
        save();
        // The worker lives on with its dictionaries, only its messages are no longer wanted
        ++searchId;
        worker.onmessage = null;
        unmountLayout();
      },
      reset: () => applyState(DEFAULT_STATE),
      examples: [
        example('Regex: Czech words k?s?', { modeSpinner: 0, dictionarySpinner: 'cs.cbfcdict', query: 'k.s.' }),
        example('Levenshtein: what is close to "cypher"', { modeSpinner: 2, dictionarySpinner: 'en.cbfcdict', query: 'cypher' }),
        example('Hamming: Czech words one letter away from "lampa"', { modeSpinner: 1, dictionarySpinner: 'cs.cbfcdict', query: 'lampa' }),
        example('Subanagram: words from the letters of "breaker"', { modeSpinner: 3, dictionarySpinner: 'en.cbfcdict', query: 'breaker', minLength: '4' }),
        example('# Morse: Czech words whose letters have 1, 3, 2 and 4 signs', { modeSpinner: 6, dictionarySpinner: 'cs.cbfcdict', query: '1324' }),
        example('Map: lookout towers, closest first', { modeSpinner: 0, dictionarySpinner: 'Czechia.cbfcmap', query: '.*rozhledna.*' }),
      ],
    };
  },
};
