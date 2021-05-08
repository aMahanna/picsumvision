import { useState, useEffect } from 'react';

/**
 * A modification of the useState() hook, allowing state values to remain even after refresh
 *
 * @param key
 * @param defaultValue
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const usePersistedState = (key: string, defaultValue: any) => {
  const [state, setState] = useState(() => {
    const persistedState = localStorage.getItem(key);
    return persistedState ? JSON.parse(persistedState) : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [state, key]);

  return [state, setState];
};

export default usePersistedState;
