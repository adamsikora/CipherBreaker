// Loads dictionaries and runs searches off the main thread. Messages in:
// { type: 'load', name, url } and { type: 'search', id, name, url, input, params, location };
// messages out: { type: 'loading', name, state, entries?, seconds? } as a load starts, ends or
// fails, { type: 'toast', id, text } and { type: 'progress', id, progress, count, time, result, done }

import { Dictionary, Location, loadDictionary, prepareKeys, QueryParams, search } from '../logic/dictionary';

export interface LoadMessage { type: 'load'; name: string; url: string }
export interface SearchMessage {
  type: 'search'; id: number; name: string; url: string; input: string; params: QueryParams; location: Location | null;
}
export type WorkerRequest = LoadMessage | SearchMessage;
export type WorkerResponse =
  | { type: 'loading'; name: string; state: 'started' | 'failed' }
  | { type: 'loading'; name: string; state: 'done'; entries: number; seconds: number }
  | { type: 'toast'; id: number; text: string }
  | { type: 'progress'; id: number; progress: number; count: number; time: number; result: string; done: boolean };

// Every dictionary loaded stays loaded, so that coming back to it costs nothing: all four take
// about 270 MB with their keys, which the page is judged to afford
const dictionaries = new Map<string, Dictionary>();
const loads = new Map<string, Promise<Dictionary>>();
let currentSearch = 0;

function post(message: WorkerResponse): void {
  self.postMessage(message);
}

function load(name: string, url: string): Promise<Dictionary> {
  const existing = dictionaries.get(name);
  if (existing) return Promise.resolve(existing);
  let promise = loads.get(name);
  if (!promise) {
    promise = (async () => {
      post({ type: 'loading', name, state: 'started' });
      const started = performance.now();
      const response = await fetch(url);
      if (!response.ok) throw new Error('Cannot load the dictionary');
      const dictionary = loadDictionary(await response.text(), name.endsWith('.cbfcmap'));
      dictionaries.set(name, dictionary);
      // The keys are made now rather than by the first search, which would be slow otherwise
      await prepareKeys(dictionary, false, yieldToMessages);
      const seconds = (performance.now() - started) / 1000;
      post({ type: 'loading', name, state: 'done', entries: dictionary.names.length, seconds });
      return dictionary;
    })();
    loads.set(name, promise);
    promise.catch(() => post({ type: 'loading', name, state: 'failed' })).finally(() => loads.delete(name));
  }
  return promise;
}

// Lets the messages that arrived meanwhile, a newer search or a load, be handled between two
// chunks of work. Through a message port rather than setTimeout(0): browsers clamp nested
// timers to 4 ms, which would cost a long search more than the chunks themselves take
const yieldChannel = new MessageChannel();
const yieldWaiters: (() => void)[] = [];
yieldChannel.port1.onmessage = () => yieldWaiters.shift()?.();
const yieldToMessages = () => new Promise<void>(resolve => {
  yieldWaiters.push(resolve);
  yieldChannel.port2.postMessage(null);
});

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
    // A failure is reported by the load itself
    load(msg.name, msg.url).catch(() => {});
  } else if (msg.type === 'search') {
    currentSearch = msg.id;
    runSearch(msg).catch(e => {
      post({ type: 'toast', id: msg.id, text: 'Unknown error ' + (e as Error).message });
      // The page hides the progress bar on the final progress only
      post({ type: 'progress', id: msg.id, progress: 100, count: 0, time: 0, result: '', done: true });
    });
  }
};
