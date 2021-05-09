/**
 * @file stores some fake data to test insert & delete operations
 */

export const image = {
  _key: '525252',
  author: 'Alejandro Escamilla',
  url: 'https://picsum.photos/id/0/300/300',
  date: new Date().toString(),
};

export const author = {
  _key: '1',
  name: 'Alejandro Escamilla',
};

export const authorOf = {
  _key: '1',
  _from: 'Authors/1',
  _to: 'Images/525252',
  _score: 1,
};

export const label = {
  _key: '1',
  mid: 'm/machineid1',
  label: 'computer',
};

export const labelOf = {
  _key: '1',
  _from: 'Labels/1',
  _to: 'Images/525252',
  _score: 1,
};

export const bestGuess = {
  _key: '1',
  bestGuess: 'A macbook air on a table',
};

export const bestGuessOf = {
  _key: '1',
  _from: 'BestGuess/1',
  _to: 'Images/525252',
  _score: 1,
};
