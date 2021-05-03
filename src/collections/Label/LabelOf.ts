/**
 * This @file manages the LabelOf Edge Collection in our ArangoDB
 */

import db from '../../database';

export interface labelOfModel {
  _from: string;
  _to: string;
  _score: number;
  _topicality: number;
}

const LabelOfCollection = db.collection('LabelOf');

class LabelOfObject {
  /**
   * @method inserts the LabelOf Edge linking an Image and a Label metadata
   *
   * @param edge implements the labelOfModel interfac
   * @returns The ArangoID of the inserted LabelOf edge
   */
  async insertLabelOf(edge: labelOfModel) {
    const result = await LabelOfCollection.save(edge);
    return result._id;
  }
}

export const labelOfObject: LabelOfObject = new LabelOfObject();
