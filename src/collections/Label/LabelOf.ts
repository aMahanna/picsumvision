/**
 * This @file manages the LabelOf Edge Collection in our ArangoDB
 */

import db from '../../database';

interface labelOfModel {
  _from: string;
  _to: string;
  _score: number;
}

const LabelOfCollection = db.collection('LabelOf');
class LabelOfObject {
  /**
   * @method inserts the LabelOf Edge linking an Image and a Label metadata
   *
   * @param edge implements the labelOfModel interface
   * @returns The ArangoID of the inserted LabelOf edge
   */
  async insertLabelOf(edge: labelOfModel): Promise<void> {
    await LabelOfCollection.save(edge, { silent: true });
  }
}

export const labelOfObject: LabelOfObject = new LabelOfObject();
