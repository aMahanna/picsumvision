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
import { labelController, labelOfController } from '../collections/Label';
import { bestGuessController, bestGuessOfController } from '../collections/BestGuess';

import { image, author, authorOf, label, labelOf, bestGuess, bestGuessOf } from '../assets/spec/sampleCRUDData';

const ImageCollection = db.collection('Image');
const AuthorCollection = db.collection('Author');
const AuthorOfCollection = db.collection('AuthorOf');
const LabelCollection = db.collection('Label');
const LabelOfCollection = db.collection('LabelOf');
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
  expect(authorAlreadyExists).toBe(`Authors/${author._key}`);

  await authorOfController.insert(authorOf);
  const authorOfDoc = await AuthorOfCollection.document(authorOf._key);
  expect(authorOfDoc._key).toBe(authorOf._key);
  expect(authorOfDoc._score).toBe(1);

  await AuthorCollection.remove(author._key, { silent: true });
  await AuthorOfCollection.remove(authorOf._key, { silent: true });
});

test('perform basic insert/delete for the Label & LabelOf collections', async () => {
  await labelController.insert(label);
  const labelDoc = await LabelCollection.document(label._key);
  expect(labelDoc._key).toBe(label._key);
  //expect(labelDoc.data.split(' ')).toContain('calculator');

  const labelAlreadyExists = await labelController.insert(label);
  expect(labelAlreadyExists).toBe(`Labels/${label._key}`);

  await labelOfController.insert(labelOf);
  const labelOfDoc = await LabelOfCollection.document(labelOf._key);
  expect(labelOfDoc._key).toBe(labelOf._key);

  await LabelCollection.remove(label._key, { silent: true });
  await LabelOfCollection.remove(labelOf._key, { silent: true });

  expect(await LabelCollection.documentExists(label._key)).toBe(false);
  expect(await LabelOfCollection.documentExists(labelOf._key)).toBe(false);
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
