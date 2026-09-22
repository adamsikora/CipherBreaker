// Loads dictionaries and runs searches off the main thread. Messages in:
// { type: 'load', name, url } and { type: 'search', id, name, url, input, params, location };
// messages out: { type: 'loading', text }, { type: 'toast', id, text } and
// { type: 'progress', id, progress, count, time, result, done }

import { Dictionary, Location, loadDictionary, QueryParams, search } from '../logic/dictionary';

export interface LoadMessage { type: 'load'; name: string; url: string }
export interface SearchMessage {
  type: 'search'; id: number; name: string; url: string; input: string; params: QueryParams; location: Location | null;
}
export type WorkerRequest = LoadMessage | SearchMessage;
export type WorkerResponse =
  | { type: 'loading'; text: string }
  | { type: 'toast'; id: number; text: string }
  | { type: 'progress'; id: number; progress: number; count: number; time: number; result: string; done: boolean };

const dictionaries = new Map<string, Dictionary>();
let loading: { name: string; promise: Promise<Dictionary> } | null = null;
let currentSearch = 0;

function post(message: WorkerResponse): void {
  self.postMessage(message);
}

async function load(name: string, url: string): Promise<Dictionary> {
  const existing = dictionaries.get(name);
  if (existing) return existing;
  if (loading && loading.name === name) return loading.promise;
  const promise = (async () => {
    post({ type: 'loading', text: `Loading ${name}…` });
    const started = performance.now();
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Cannot load ${name}`);
    const dictionary = loadDictionary(await response.text(), name.endsWith('.cbfcmap'));
    // Only the dictionary searched last is kept, the others would take too much memory
    dictionaries.clear();
    dictionaries.set(name, dictionary);
    const seconds = ((performance.now() - started) / 1000).toFixed(2);
    post({ type: 'loading', text: `${dictionary.names.length} entries loaded in ${seconds} s` });
    return dictionary;
  })();
  loading = { name, promise };
  try {
    return await promise;
  } finally {
    if (loading && loading.promise === promise) loading = null;
  }
}

const yieldToMessages = () => new Promise<void>(resolve => setTimeout(resolve, 0));

async function runSearch(msg: SearchMessage): Promise<void> {
  const { id } = msg;
  const shouldStop = () => currentSearch !== id;
  let dictionary: Dictionary;
  try {
    dictionary = await load(msg.name, msg.url);
  } catch (e) {
    post({ type: 'toast', id, text: (e as Error).message });
    post({ type: 'progress', id, progress: 100, count: 0, time: 0, result: '', done: true });
    return;
  }
  if (shouldStop()) return;
  await search(dictionary, msg.input, msg.params, msg.location, {
    toast: text => post({ type: 'toast', id, text }),
    progress: (progress, count, time, result, done) => post({ type: 'progress', id, progress, count, time, result, done }),
  }, yieldToMessages, shouldStop);
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  if (msg.type === 'load') {
    load(msg.name, msg.url).catch(e => post({ type: 'loading', text: (e as Error).message }));
  } else if (msg.type === 'search') {
    currentSearch = msg.id;
    runSearch(msg).catch(e => post({ type: 'toast', id: msg.id, text: 'Unknown error ' + (e as Error).message }));
  }
};
