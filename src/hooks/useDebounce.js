import { useEffect, useState } from 'react';

/**
 * Returns `value` after it has stopped changing for `delay` ms.
 *
 * Standard debounce for search-as-you-type inputs that drive a query — keeps
 * the keystroke responsive while the network call waits for a pause.
 *
 * @param {*} value
 * @param {number} delay - milliseconds of quiet before the value updates
 */
export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export default useDebounce;
