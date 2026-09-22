// Saved state of the tools, the counterpart of SharedPreferences. Storage may be unavailable
// (private windows, blocked site data), so both directions swallow errors.

export function loadState<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : { ...fallback, ...JSON.parse(value) };
  } catch (e) {
    return fallback;
  }
}

export function saveState(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Nothing to do, the state is just not remembered
  }
}
