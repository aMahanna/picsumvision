/**
 * This @file manages the LabelOf Edge Collection in our ArangoDB
 */

import db from '../../database';

interface labelOfModel {
  _from: string;
  _to: string;
  _score: number;
  _topicality: number;
}

const LabelOfCollection = db.collection('LabelOf');

export async function insertLabelOf(document: labelOfModel) {
  const result = await LabelOfCollection.save(document);
  return result._id;
}
