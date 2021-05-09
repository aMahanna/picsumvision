/**
 * @file covers Collection insertions and deletions
 * Current collections tested:
 * - Image
 * - Author & AuthorOf
 * - Label & LabelOf
 * - BestGuess & BestGuessOf
 */

import db from '../database';

import { imageObject } from '../collections/Image';
import { authorObject, authorOfObject } from '../collections/Author';
import { labelObject, labelOfObject } from '../collections/Label';
import { bestGuessObject, bestGuessOfObject } from '../collections/BestGuess';

import { image, author, authorOf, label, labelOf, bestGuess, bestGuessOf } from '../assets/sampleData';

const ImageCollection = db.collection('Images');
const AuthorCollection = db.collection('Authors');
const AuthorOfCollection = db.collection('AuthorOf');
const LabelCollection = db.collection('Labels');
const LabelOfCollection = db.collection('LabelOf');
const BestGuessCollection = db.collection('BestGuess');
const BestGuessOfCollection = db.collection('BestGuessOf');

test('confirm database connection', async () => {
  expect(await db.exists()).toBe(true);
});

test('perform basic insert/delete for the Image collections', async () => {
  await imageObject.insertImage(image);
  const imageDoc = await ImageCollection.document(image._key, true);
  expect(imageDoc._key).toBe(image._key);

  const imageInsert = await imageObject.insertImage(image);
  expect(imageInsert.alreadyExists).toBe(true);

  await ImageCollection.remove(image._key, { silent: true });
  expect(await ImageCollection.documentExists(image._key)).toBe(false);
});

test('should perform basic insert/delete for the Author & AuthorOf collections', async () => {
  await authorObject.insertAuthor(author);
  const authorDoc = await AuthorCollection.document(author._key);
  expect(authorDoc._key).toBe(author._key);
  expect(authorDoc.name).toBe('John Doe');

  const authorAlreadyExists = await authorObject.insertAuthor(author);
  expect(authorAlreadyExists).toBe(`Authors/${author._key}`);

  await authorOfObject.insertAuthorOf(authorOf);
  const authorOfDoc = await AuthorOfCollection.document(authorOf._key);
  expect(authorOfDoc._key).toBe(authorOf._key);
  expect(authorOfDoc._score).toBe(1);

  await AuthorCollection.remove(author._key, { silent: true });
  await AuthorOfCollection.remove(authorOf._key, { silent: true });
});

test('perform basic insert/delete for the Label & LabelOf collections', async () => {
  await labelObject.insertLabel(label);
  const labelDoc = await LabelCollection.document(label._key);
  expect(labelDoc._key).toBe(label._key);
  //expect(labelDoc.data.split(' ')).toContain('calculator');

  const labelAlreadyExists = await labelObject.insertLabel(label);
  expect(labelAlreadyExists).toBe(`Labels/${label._key}`);

  await labelOfObject.insertLabelOf(labelOf);
  const labelOfDoc = await LabelOfCollection.document(labelOf._key);
  expect(labelOfDoc._key).toBe(labelOf._key);

  await LabelCollection.remove(label._key, { silent: true });
  await LabelOfCollection.remove(labelOf._key, { silent: true });

  expect(await LabelCollection.documentExists(label._key)).toBe(false);
  expect(await LabelOfCollection.documentExists(labelOf._key)).toBe(false);
});

test('perform basic insert/delete for the BestGuess & BestGuessOf collections', async () => {
  await bestGuessObject.insertBestGuess(bestGuess);
  const bestGuessDoc = await BestGuessCollection.document(bestGuess._key);
  expect(bestGuessDoc._key).toBe(bestGuess._key);
  expect(bestGuess.bestGuess).toBe('A puppy sitting on grass');

  const bestGuessAlreadyExists = await bestGuessObject.insertBestGuess(bestGuess);
  expect(bestGuessAlreadyExists).toBe(`BestGuess/${bestGuess._key}`);

  await bestGuessOfObject.insertBestGuessOf(bestGuessOf);
  const bestGuessOfDoc = await BestGuessOfCollection.document(bestGuessOf._key);
  expect(bestGuessOfDoc._key).toBe(bestGuessOfDoc._key);

  await BestGuessCollection.remove(bestGuess._key, { silent: true });
  await BestGuessOfCollection.remove(bestGuessOf._key, { silent: true });
});
