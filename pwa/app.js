// UI of the Dictionary Searcher, the searching itself runs in search-worker.js

const modeSelect = document.getElementById('mode');
const dictionarySelect = document.getElementById('dictionary');
const minLengthBox = document.getElementById('minLength');
const maxLengthBox = document.getElementById('maxLength');
const diacriticsBox = document.getElementById('diacritics');
const positionRow = document.getElementById('position');
const positionText = document.getElementById('positionText');
const locateButton = document.getElementById('locate');
const form = document.getElementById('form');
const queryBox = document.getElementById('query');
const countView = document.getElementById('count');
const timeView = document.getElementById('time');
const loadingView = document.getElementById('loading');
const progressBar = document.getElementById('progress');
const resultView = document.getElementById('result');
const toastView = document.getElementById('toast');

const worker = new Worker('search-worker.js');
let searchId = 0;
let userLocation = null;
let toastTimer = null;

function toast(text) {
  toastView.textContent = text;
  toastView.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastView.classList.remove('visible'), 2500);
}

function isMapDictionaryChosen() {
  return dictionarySelect.value.endsWith('.cbfcmap');
}

function refreshControls() {
  const mode = modeSelect.selectedIndex;
  // Only Regex, Hamming and Levenshtein can be sensitive to diacritics
  diacriticsBox.disabled = !(mode === 0 || mode === 4 || mode === 5);
  queryBox.inputMode = mode >= 6 ? 'numeric' : 'text';
  positionRow.classList.toggle('visible', isMapDictionaryChosen());
}

function saveState() {
  try {
    localStorage.setItem('state', JSON.stringify({
      mode: modeSelect.selectedIndex,
      dictionary: dictionarySelect.value,
      minLength: minLengthBox.value,
      maxLength: maxLengthBox.value,
      diacritics: diacriticsBox.checked,
      query: queryBox.value,
    }));
  } catch (e) { /* storage may be unavailable */ }
}

function loadState() {
  try {
    const state = JSON.parse(localStorage.getItem('state'));
    if (!state) return;
    modeSelect.selectedIndex = state.mode || 0;
    if ([...dictionarySelect.options].some(o => o.value === state.dictionary)) {
      dictionarySelect.value = state.dictionary;
    }
    minLengthBox.value = state.minLength || '';
    maxLengthBox.value = state.maxLength || '';
    diacriticsBox.checked = !!state.diacritics;
    queryBox.value = state.query || '';
  } catch (e) { /* ignore broken state */ }
}

function acquireLocation() {
  if (!navigator.geolocation) {
    toast('Geolocation is not available');
    return;
  }
  positionText.textContent = 'Position: acquiring…';
  navigator.geolocation.getCurrentPosition(pos => {
    userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    positionText.textContent = `Position: ${userLocation.lat.toFixed(5)}, ${userLocation.lon.toFixed(5)}`;
  }, err => {
    positionText.textContent = 'Position: unknown';
    toast('Location not available: ' + err.message);
  }, { enableHighAccuracy: true, timeout: 15000 });
}

function updateProgress(progress, count, time, result) {
  progressBar.value = progress;
  countView.textContent = count;
  timeView.textContent = time.toFixed(3);
  resultView.textContent = result;
}

function parseIntWithDefault(text, fallback) {
  const value = parseInt(text, 10);
  return Number.isFinite(value) ? value : fallback;
}

function searchDictionary() {
  const minLength = parseIntWithDefault(minLengthBox.value, 0);
  const maxLength = parseIntWithDefault(maxLengthBox.value, Number.MAX_SAFE_INTEGER);
  if (minLength > maxLength) {
    toast(`Min length (${minLength}) is greater than max length (${maxLength}). Aborting calculation`);
    return;
  }
  if (isMapDictionaryChosen() && userLocation === null) {
    acquireLocation();
  }
  saveState();
  progressBar.value = 0;
  progressBar.classList.add('visible');
  worker.postMessage({
    type: 'search',
    id: ++searchId,
    name: dictionarySelect.value,
    modeId: modeSelect.selectedIndex,
    input: queryBox.value.toLowerCase(),
    minLength,
    maxLength,
    diacritics: !diacriticsBox.disabled && diacriticsBox.checked,
    location: userLocation,
  });
}

worker.onmessage = event => {
  const msg = event.data;
  switch (msg.type) {
    case 'loading':
      loadingView.textContent = msg.text;
      break;
    case 'toast':
      if (msg.id === searchId) toast(msg.text);
      break;
    case 'progress':
      if (msg.id !== searchId) break;
      updateProgress(msg.progress, msg.count, msg.time, msg.result);
      if (msg.done) {
        progressBar.classList.remove('visible');
        loadingView.textContent = '';
      }
      break;
  }
};

modeSelect.addEventListener('change', refreshControls);
dictionarySelect.addEventListener('change', () => {
  refreshControls();
  if (isMapDictionaryChosen() && userLocation === null) acquireLocation();
  // Loading a dictionary takes a while, it starts as soon as it is chosen
  worker.postMessage({ type: 'load', name: dictionarySelect.value });
});
locateButton.addEventListener('click', acquireLocation);
form.addEventListener('submit', event => {
  event.preventDefault();
  searchDictionary();
});

loadState();
refreshControls();
worker.postMessage({ type: 'load', name: dictionarySelect.value });
queryBox.focus();

if ('serviceWorker' in navigator) {
  // All the dictionaries are downloaded when the service worker installs, the user is told when it is done
  navigator.serviceWorker.register('sw.js').then(registration => {
    const installing = registration.installing;
    if (!installing) return;
    toast('Downloading dictionaries for offline use…');
    installing.addEventListener('statechange', () => {
      if (installing.state === 'activated') toast('Dictionaries downloaded, the app works offline now');
      else if (installing.state === 'redundant') toast('Downloading dictionaries failed');
    });
  });
}
