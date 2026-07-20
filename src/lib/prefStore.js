// Tiny localStorage-backed external stores for cross-component user prefs
// (display currency, buyer country). Why not plain useState-per-hook: the
// `storage` event only fires in OTHER tabs, so two components in the SAME tab
// would drift apart. Subscribers here get notified synchronously on set(),
// and cross-tab changes still arrive via the storage listener.

const stores = new Map();

export const getPrefStore = (key) => {
  let store = stores.get(key);
  if (store) return store;

  const listeners = new Set();

  const read = () => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  let value = read();
  const notify = () => listeners.forEach((l) => l());

  store = {
    get: () => value,
    set: (next) => {
      value = next;
      try {
        if (next === null) localStorage.removeItem(key);
        else localStorage.setItem(key, next);
      } catch {
        /* private mode etc. — in-memory value still works for this tab */
      }
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === key) {
        value = read();
        notify();
      }
    });
  }

  stores.set(key, store);
  return store;
};
