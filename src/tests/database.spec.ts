/**
 * @file covers Collection insertions and deletions
 * Current collections tested:
 * - Image
 * - Author & AuthorOf
 * - Label & LabelOf
 * - BestGuess & BestGuessOf
 */

import db from '../database';

import { imageController } from '../collections/Image';
import { authorController, authorOfController } from '../collections/Author';
import { tagController, tagOfController } from '../collections/Tag';
import { bestGuessController, bestGuessOfController } from '../collections/BestGuess';

import { image, author, authorOf, tag, tagOf, bestGuess, bestGuessOf } from '../assets/spec/sampleCRUDData';

const ImageCollection = db.collection('Image');
const AuthorCollection = db.collection('Author');
const AuthorOfCollection = db.collection('AuthorOf');
const TagCollection = db.collection('Label');
const TagOfCollection = db.collection('LabelOf');
const BestGuessCollection = db.collection('BestGuess');
const BestGuessOfCollection = db.collection('BestGuessOf');

test('confirm database connection', async () => {
  expect(await db.exists()).toBe(true);
});

test('perform basic insert/delete for the Image collections', async () => {
  await imageController.insert(image);
  const imageDoc = await ImageCollection.document(image._key, true);
  expect(imageDoc._key).toBe(image._key);

  const imageInsert = await imageController.insert(image);
  expect(imageInsert.alreadyExists).toBe(true);

  await ImageCollection.remove(image._key, { silent: true });
  expect(await ImageCollection.documentExists(image._key)).toBe(false);
});

test('should perform basic insert/delete for the Author & AuthorOf collections', async () => {
  await authorController.insert(author);
  const authorDoc = await AuthorCollection.document(author._key);
  expect(authorDoc._key).toBe(author._key);
  expect(authorDoc.name).toBe('John Doe');

  const authorAlreadyExists = await authorController.insert(author);
  expect(authorAlreadyExists).toBe(`Author/${author._key}`);

  await authorOfController.insert(authorOf);
  const authorOfDoc = await AuthorOfCollection.document(authorOf._key);
  expect(authorOfDoc._key).toBe(authorOf._key);
  expect(authorOfDoc._score).toBe(1);

  await AuthorCollection.remove(author._key, { silent: true });
  await AuthorOfCollection.remove(authorOf._key, { silent: true });
});

test('perform basic insert/delete for the Label & LabelOf collections', async () => {
  await tagController.insert(tag);
  const tagDoc = await TagCollection.document(tag._key);
  expect(tagDoc._key).toBe(tag._key);
  //expect(labelDoc.data.split(' ')).toContain('calculator');

  const labelAlreadyExists = await tagController.insert(tag);
  expect(labelAlreadyExists).toBe(`Label/${tag._key}`);

  await tagOfController.insert(tagOf);
  const tagOfDoc = await TagOfCollection.document(tagOf._key);
  expect(tagOfDoc._key).toBe(tagOf._key);

  await TagCollection.remove(tag._key, { silent: true });
  await TagCollection.remove(tagOf._key, { silent: true });

  expect(await TagCollection.documentExists(tag._key)).toBe(false);
  expect(await TagOfCollection.documentExists(tagOf._key)).toBe(false);
});

test('perform basic insert/delete for the BestGuess & BestGuessOf collections', async () => {
  await bestGuessController.insert(bestGuess);
  const bestGuessDoc = await BestGuessCollection.document(bestGuess._key);
  expect(bestGuessDoc._key).toBe(bestGuess._key);
  expect(bestGuess.bestGuess).toBe('A puppy sitting on grass');

  const bestGuessAlreadyExists = await bestGuessController.insert(bestGuess);
  expect(bestGuessAlreadyExists).toBe(`BestGuess/${bestGuess._key}`);

  await bestGuessOfController.insert(bestGuessOf);
  const bestGuessOfDoc = await BestGuessOfCollection.document(bestGuessOf._key);
  expect(bestGuessOfDoc._key).toBe(bestGuessOfDoc._key);

  await BestGuessCollection.remove(bestGuess._key, { silent: true });
  await BestGuessOfCollection.remove(bestGuessOf._key, { silent: true });
});
