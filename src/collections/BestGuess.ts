/**
 * This @file manages the BestGuess & BestGuessOf Collections in ArangoDB
 */

import db from '../database';

interface bestGuessModel {
  _key: string;
  bestGuess: string;
}

interface bestGuessOfModel {
  _from: string;
  _to: string;
  _score: number;
}

const BestGuessCollection = db.collection('BestGuess');
const BestGuessOfCollection = db.collection('BestGuessOf');

class BestGuessController {
  /**
   * @method used to insert the BestGuess metadata of a particular image
   * Avoids  duplicates by checking if the guess already exists
   *
   * @param document implements the buestGuessModel interface
   * @returns the ArangoID of the BestGuess inserted
   */
  public async insert(document: bestGuessModel): Promise<string> {
    const existingBestGuess = await BestGuessCollection.document({ _key: document._key }, true);
    return existingBestGuess
      ? existingBestGuess._id
      : (await BestGuessCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;
  }
}

class BestGuessOfController {
  /**
   * @method inserts the BestGuessOf Edge linking an Image and a Vision Best Guess
   *
   * @param edge implements the bestGuessOfModel interface
   */
  async insert(edge: bestGuessOfModel): Promise<void> {
    await BestGuessOfCollection.save(edge, { silent: true });
  }
}

export const bestGuessController: BestGuessController = new BestGuessController();
export const bestGuessOfController: BestGuessOfController = new BestGuessOfController();
