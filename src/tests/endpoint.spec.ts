/**
 * @file Hits all endpoint variations of the application
 * - /api/info/image
 * - /api/info/randomkeys
 * - /api/search/mixed
 * - /api/search/mixed
 * - /api/search/extimage
 * - /api/search/surpriseme
 * - /api/search/discovery
 * - /api/insert
 * - /api/erase
 */

import app from '../../server';
import supertest from 'supertest';
const request = supertest(app);

test('Fetch Image information about Image/0', async () => {
  const res = await request.get(`/api/info/image?id=0`);
  expect(res.status).toBe(200);
  expect(res.body.data).toHaveProperty(['image']);
  expect(res.body.data.image._id).toBe('Images/0');
  expect(res.body.data.bestGuess.length).toBeGreaterThan(0);
  expect(res.body.data.labels.length).toBeGreaterThan(0);
  expect(res.body.data.similar.length).toBeGreaterThan(0);
});

test('Return random labels from ArangoDB', async () => {
  const res = await request.get(`/api/info/randomkeys`);
  expect(res.status).toBe(200);
  expect(res.body.labels).toBeDefined();
  expect(res.body.labels.split(' ').length).toBeGreaterThan(1);
});

test('Search for Images using "Water" and "Sky"', async () => {
  const res = await request.get(`/api/search/mixed?labels=water%20sky`);
  expect(res.status).toBe(200);
  expect(res.body.labels).toBe('sky water');
  expect(res.body.data.length).toBeGreaterThan(0);

  const resEmpty = await request.get(`/api/search/mixed`);
  expect(resEmpty.status).toBe(400);
  expect(resEmpty.body).toBe('User must pass labels as a string to search');

  const resVisualize = await request.get(`/api/search/mixed?labels=cloud&isVisualizeRequest=true`);
  expect(resVisualize.status).toBe(200);
  expect(resVisualize.body.graphObject.nodes.length).toBeGreaterThan(2);
  expect(resVisualize.body.graphObject.edges.length).toBeGreaterThan(1);
});

test('Search for images using an external image URL', async () => {
  const res = await request.get(`/api/search/extimage?url=https://picsum.photos/id/0/500/500`);
  expect(res.status).toBe(200);
  expect(res.body.labels.split(' ').length).toBeGreaterThan(0);

  const resEmpty = await request.get(`/api/search/extimage`);
  expect(resEmpty.status).toBe(400);
});

test('Search for an image using labels randomly selected from ArangoDB', async () => {
  const res = await request.get(`/api/search/surpriseme`);
  expect(res.status).toBe(200);
  expect(res.body.data.length).toBeGreaterThan(0);
  expect(res.body.labels).toBeDefined();
  expect(res.body.labels.split(' ').length).toBeGreaterThan(1);
});

test('Discover images similar to user search & click history', async () => {
  const res = await request.get(`/api/search/discovery?IDs=0`);
  expect(res.status).toBe(200);
  expect(res.body.data.length).toBeGreaterThan(0);
});

// test('Insert image (todo)', async () => {
//   const res: any = await request.get(`/api/insert`);
//   expect(res.status).toBe(201);
//   expect(res.body).toBe('TODO!');
// });

// test('Delete image (todo)', async () => {
//   const res: any = await request.get(`/api/erase`);
//   expect(res.status).toBe(200);
//   expect(res.body).toBe('TODO!');
// });
