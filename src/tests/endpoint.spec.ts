/**
 * @file Hits all endpoint variations of the application
 * - /api/info/image
 * - /api/info/randomkeys
 * - /api/search/keyword
 * - /api/search/extimage
 * - /api/search/surpriseme
 * - /api/search/discover
 * - /api/search/visualize
 * - /api/insert
 * - /api/erase
 */

import app from '../../server';
import supertest from 'supertest';
import lastSearchResult from '../assets/spec/sampleLastSearchResult';

const request = supertest(app);

test('Fetch Image information about Image/0', async () => {
  const res = await request.get(`/api/info/image?id=0`);
  expect(res.status).toBe(200);
  expect(res.body.data).toHaveProperty(['image']);
  expect(res.body.data.image._id).toBe('Image/0');
  expect(res.body.data.bestGuess.length).toBeGreaterThan(0);
  expect(res.body.data.labels.length).toBeGreaterThan(0);
  expect(res.body.data.similar.length).toBeGreaterThan(0);
});

test('Return random labels from ArangoDB', async () => {
  const res = await request.get(`/api/info/randomkeys`);
  expect(res.status).toBe(200);
  expect(res.body.labels).toBeDefined();
  expect(res.body.labels.split(' ').length).toBeGreaterThan(0);
});

test('Search for Images using "Water" and "Sky"', async () => {
  const res = await request.get(`/api/search/keyword?labels=coffee`);
  expect(res.status).toBe(200);
  expect(res.body.data.length).toBeGreaterThan(0);

  const resEmpty = await request.get(`/api/search/keyword`);
  expect(resEmpty.status).toBe(400);
  expect(resEmpty.body).toBe('User must pass labels as a string to search');
});

test('Search for images using an external image URL', async () => {
  const res = await request.get(`/api/search/extimage?url=https://picsum.photos/id/1056/3988/2720`);
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
  expect(res.body.labels.split(' ').length).toBeGreaterThan(0);
});

test('Discover images similar to user search & click history', async () => {
  const res = await request.get(`/api/search/discover?IDs=0`);
  expect(res.status).toBe(200);
  expect(res.body.data.length).toBeGreaterThan(0);
});

test('Visualize image results', async () => {
  const resSearch = await request
    .post('/api/search/visualize?type=search')
    .send({ labels: 'computer', lastSearchResult })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/);
  expect(resSearch.status).toBe(200);
  expect(resSearch.body.graphObject.nodes.length).toBeGreaterThan(2);
  expect(resSearch.body.graphObject.edges.length).toBeGreaterThan(1);

  const resImage = await request
    .post('/api/search/visualize?type=image')
    .send({ imageID: '1' })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/);
  expect(resImage.status).toBe(200);
  expect(resImage.body.graphObject.nodes.length).toBeGreaterThan(2);
  expect(resImage.body.graphObject.edges.length).toBeGreaterThan(1);
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
