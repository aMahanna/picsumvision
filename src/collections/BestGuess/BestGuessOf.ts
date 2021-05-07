/**
 * This @file manages the LabelOf Edge Collection in our ArangoDB
 */

import db from '../../database';

interface bestGuessOfModel {
  _from: string;
  _to: string;
  _score: 1; // A best guess has a confidence score of 1
}

const BestGuessOfCollection = db.collection('BestGuessOf');
class BestGuessOfObject {
  /**
   * @method inserts the BestGuessOf Edge linking an Image and a Vision Best Guess
   *
   * @param edge implements the bestGuessOfModel interface
   * @returns The ArangoID of the inserted BestGuessOf edge
   */
  async insertBestGuessOf(edge: bestGuessOfModel): Promise<void> {
    await BestGuessOfCollection.save(edge, { silent: true });
  }
}

export const bestGuessOfObject: BestGuessOfObject = new BestGuessOfObject();
