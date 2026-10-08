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
