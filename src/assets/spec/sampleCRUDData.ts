/**
 * @file stores some fake data to test insert & delete operations
 */

export const image = {
  _key: '525252',
  author: 'John Doe',
  url: 'https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg',
  date: new Date().toString(),
};

export const author = {
  _key: '1',
  author: 'John Doe',
};

export const authorOf = {
  _key: '1',
  _from: 'Author/1',
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
  _from: 'Label/1',
  _to: 'Images/525252',
  _score: 1,
};

export const bestGuess = {
  _key: '1',
  bestGuess: 'A puppy sitting on grass',
};

export const bestGuessOf = {
  _key: '1',
  _from: 'BestGuess/1',
  _to: 'Images/525252',
  _score: 1,
};
