/**
 * Sample Vision Metadata to test ArangoDB functionalities with.
 * This avoids having to call the API on every test
 * 91 labels, 43 unique labels
 */
const VISION_TEST_LABELS: {
  mid: string;
  description?: string;
  name?: string;
  score: number;
  topicality?: number;
  boundingPoly?: { normalizedVertices: [ArrayConstructor] };
}[][] = [
  [
    {
      mid: '/m/0838f',
      description: 'Water',
      score: 0.972364,
      topicality: 0.972364,
    },
    {
      mid: '/m/0csby',
      description: 'Cloud',
      score: 0.97032434,
      topicality: 0.97032434,
    },
    {
      mid: '/m/01bqvp',
      description: 'Sky',
      score: 0.96111584,
      topicality: 0.96111584,
    },
    {
      mid: '/m/0jbk',
      name: 'Animal',
      score: 0.6398753,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/0838f',
      description: 'Water',
      score: 0.9766998,
      topicality: 0.9766998,
    },
    {
      mid: '/m/01bqvp',
      description: 'Sky',
      score: 0.97430104,
      topicality: 0.97430104,
    },
    {
      mid: '/m/05s2s',
      description: 'Plant',
      score: 0.9383074,
      topicality: 0.9383074,
    },
  ],
  [
    {
      mid: '/m/01m3v',
      description: 'Computer',
      score: 0.97326285,
      topicality: 0.97326285,
    },
    {
      mid: '/m/04bcr3',
      description: 'Table',
      score: 0.9657411,
      topicality: 0.9657411,
    },
    {
      mid: '/m/0643t',
      description: 'Personal computer',
      score: 0.95619124,
      topicality: 0.95619124,
    },
    {
      mid: '/m/01c648',
      name: 'Laptop',
      score: 0.9239624,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/03q5c7',
      name: 'Saucer',
      score: 0.9136939,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/050k8',
      name: 'Mobile phone',
      score: 0.8901435,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/02py09',
      description: 'Natural environment',
      score: 0.8886141,
      topicality: 0.8886141,
    },
    {
      mid: '/m/083vt',
      description: 'Wood',
      score: 0.87354785,
      topicality: 0.87354785,
    },
    {
      mid: '/m/0b5gs',
      description: 'Branch',
      score: 0.8697647,
      topicality: 0.8697647,
    },
    {
      mid: '/m/09kx5',
      name: 'Deer',
      score: 0.9397071,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/0csby',
      description: 'Cloud',
      score: 0.97886467,
      topicality: 0.97886467,
    },
    {
      mid: '/m/01bqvp',
      description: 'Sky',
      score: 0.96364605,
      topicality: 0.96364605,
    },
    {
      mid: '/m/0g2z8',
      description: 'Fog',
      score: 0.8947768,
      topicality: 0.8947768,
    },
    {
      mid: '/m/01g317',
      name: 'Person',
      score: 0.8595268,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/0jbk',
      name: 'Animal',
      score: 0.6694937,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/0hf58v5',
      name: 'Luggage & bags',
      score: 0.5896942,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/0csby',
      description: 'Cloud',
      score: 0.97309375,
      topicality: 0.97309375,
    },
    {
      mid: '/m/01bqvp',
      description: 'Sky',
      score: 0.96697766,
      topicality: 0.96697766,
    },
    {
      mid: '/m/0cgh4',
      name: 'Building',
      score: 0.7985457,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/0csby',
      description: 'Cloud',
      score: 0.97765857,
      topicality: 0.97765857,
    },
    {
      mid: '/m/01bqvp',
      description: 'Sky',
      score: 0.96493423,
      topicality: 0.96493423,
    },
    {
      mid: '/m/05s2s',
      description: 'Plant',
      score: 0.95837295,
      topicality: 0.95837295,
    },
    {
      mid: '/m/01g317',
      name: 'Person',
      score: 0.91135514,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/07mhn',
      name: 'Pants',
      score: 0.889869,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/03gx245',
      name: 'Top',
      score: 0.6628879,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/0csby',
      description: 'Cloud',
      score: 0.97812647,
      topicality: 0.97812647,
    },
    {
      mid: '/m/01ctsf',
      description: 'Atmosphere',
      score: 0.9481808,
      topicality: 0.9481808,
    },
    {
      mid: '/m/01bqvp',
      description: 'Sky',
      score: 0.94701254,
      topicality: 0.94701254,
    },
  ],
  [
    {
      mid: '/m/01ctsf',
      description: 'Atmosphere',
      score: 0.9481808,
      topicality: 0.9481808,
    },
    {
      mid: '/m/0838f',
      description: 'Water',
      score: 0.91295284,
      topicality: 0.91295284,
    },
    {
      mid: '/m/01g5v',
      description: 'Blue',
      score: 0.8924198,
      topicality: 0.8924198,
    },
  ],
  [
    {
      mid: '/m/01m3v',
      description: 'Computer',
      score: 0.97200763,
      topicality: 0.97200763,
    },
    {
      mid: '/m/0k65p',
      description: 'Hand',
      score: 0.95884055,
      topicality: 0.95884055,
    },
    {
      mid: '/m/0643t',
      description: 'Personal computer',
      score: 0.9555176,
      topicality: 0.9555176,
    },
    {
      mid: '/m/01c648',
      name: 'Laptop',
      score: 0.87786454,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/01g317',
      name: 'Person',
      score: 0.8624734,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/050k8',
      name: 'Mobile phone',
      score: 0.8499902,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/0csby',
      description: 'Cloud',
      score: 0.97490066,
      topicality: 0.97490066,
    },
    {
      mid: '/m/01bqvp',
      description: 'Sky',
      score: 0.9630589,
      topicality: 0.9630589,
    },
    {
      mid: '/m/01bfm9',
      description: 'Shorts',
      score: 0.9438791,
      topicality: 0.9438791,
    },
    {
      mid: '/m/01g317',
      name: 'Person',
      score: 0.91449517,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/08xgn7',
      description: 'Comfort',
      score: 0.89327276,
      topicality: 0.89327276,
    },
    {
      mid: '/m/0bt_c3',
      description: 'Book',
      score: 0.87523925,
      topicality: 0.87523925,
    },
    {
      mid: '/m/01h1dd',
      description: 'Publication',
      score: 0.86961764,
      topicality: 0.86961764,
    },
    {
      mid: '/m/01g317',
      name: 'Person',
      score: 0.8702602,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/j/5qg9b8',
      name: 'Packaged goods',
      score: 0.6099505,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/05s2s',
      description: 'Plant',
      score: 0.9643354,
      topicality: 0.9643354,
    },
    {
      mid: '/m/08t9c_',
      description: 'Grass',
      score: 0.8456547,
      topicality: 0.8456547,
    },
    {
      mid: '/j/3gbwgn',
      description: 'People in nature',
      score: 0.84426874,
      topicality: 0.84426874,
    },
    {
      mid: '/m/01g317',
      name: 'Person',
      score: 0.85233647,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/0bt9lr',
      name: 'Dog',
      score: 0.8226935,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/07mhn',
      name: 'Pants',
      score: 0.62785876,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/0k65p',
      description: 'Hand',
      score: 0.95719963,
      topicality: 0.95719963,
    },
    {
      mid: '/m/0244x1',
      description: 'Gesture',
      score: 0.85260487,
      topicality: 0.85260487,
    },
    {
      mid: '/m/03f52z',
      description: 'Eyelash',
      score: 0.84942144,
      topicality: 0.84942144,
    },
    {
      mid: '/m/054_l',
      name: 'Mirror',
      score: 0.74402744,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/0csby',
      description: 'Cloud',
      score: 0.9759294,
      topicality: 0.9759294,
    },
    {
      mid: '/m/01bqvp',
      description: 'Sky',
      score: 0.96683234,
      topicality: 0.96683234,
    },
    {
      mid: '/j/3gbwgn',
      description: 'People in nature',
      score: 0.8917425,
      topicality: 0.8917425,
    },
    {
      mid: '/m/02h19r',
      name: 'Scarf',
      score: 0.93895346,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/01g317',
      name: 'Person',
      score: 0.88996965,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/047vlmn',
      name: 'Outerwear',
      score: 0.8513119,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/01bqvp',
      description: 'Sky',
      score: 0.95495933,
      topicality: 0.95495933,
    },
    {
      mid: '/m/0csby',
      description: 'Cloud',
      score: 0.95076007,
      topicality: 0.95076007,
    },
    {
      mid: '/m/0838f',
      description: 'Water',
      score: 0.9283347,
      topicality: 0.9283347,
    },
    {
      mid: '/m/01g317',
      name: 'Person',
      score: 0.78887695,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/02h19r',
      name: 'Scarf',
      score: 0.5856847,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/0838f',
      description: 'Water',
      score: 0.96145856,
      topicality: 0.96145856,
    },
    {
      mid: '/g/1tr17zw8',
      description: 'Flash photography',
      score: 0.8849452,
      topicality: 0.8849452,
    },
    {
      mid: '/j/3gbwgn',
      description: 'People in nature',
      score: 0.8721419,
      topicality: 0.8721419,
    },
    {
      mid: '/m/01g317',
      name: 'Person',
      score: 0.8912193,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/0838f',
      description: 'Water',
      score: 0.9816749,
      topicality: 0.9816749,
    },
    {
      mid: '/m/01bqvp',
      description: 'Sky',
      score: 0.9725793,
      topicality: 0.9725793,
    },
    {
      mid: '/m/0csby',
      description: 'Cloud',
      score: 0.960474,
      topicality: 0.960474,
    },
    {
      mid: '/m/01g317',
      name: 'Person',
      score: 0.83698833,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/019jd',
      name: 'Boat',
      score: 0.7645144,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/09j2d',
      name: 'Clothing',
      score: 0.682222,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/0d4v4',
      name: 'Window',
      score: 0.8137978,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/02crq1',
      name: 'Couch',
      score: 0.82159865,
      boundingPoly: { normalizedVertices: [Array] },
    },
    {
      mid: '/m/05s2s',
      description: 'Plant',
      score: 0.91140306,
      topicality: 0.91140306,
    },
    {
      mid: '/m/03fp41',
      name: 'Houseplant',
      score: 0.69493604,
      boundingPoly: { normalizedVertices: [Array] },
    },
  ],
  [
    {
      mid: '/m/0838f',
      description: 'Water',
      score: 0.9787489,
      topicality: 0.9787489,
    },
    {
      mid: '/m/01bqvp',
      description: 'Sky',
      score: 0.97404844,
      topicality: 0.97404844,
    },
    {
      mid: '/m/0csby',
      description: 'Cloud',
      score: 0.96955687,
      topicality: 0.96955687,
    },
  ],
];

export default VISION_TEST_LABELS;
