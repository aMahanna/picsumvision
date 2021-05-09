import { useState } from 'react';

/**
 * A modification of the useState() hook, allowing to return the persisted state value
 *
 * @param key
 * @param defaultValue
 */
const getPersistedState = (key: string) => {
  const state = useState(() => {
    const persistedState = localStorage.getItem(key);
    const persistedData = persistedState ? JSON.parse(persistedState) : {};
    return Object.keys(persistedData).length === 0 ? undefined : Object.entries(persistedData).map(e => ({ [e[0]]: e[1] }));
  });

  return state;
};

export default getPersistedState;
