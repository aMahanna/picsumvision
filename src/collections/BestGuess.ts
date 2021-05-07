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
  _score: 1; // A best guess always has a confidence score of 1
}

const BestGuessCollection = db.collection('BestGuess');
const BestGuessOfCollection = db.collection('BestGuessOf');

class BestGuessObject {
  /**
   * @method used to insert the BestGuess metadata of a particular image
   * Avoids  duplicates by checking if the guess already exists (highly doubt this will ever happen)
   *
   * @param document implements the buestGuessModel interface
   * @returns the ArangoID of the BestGuess inserted
   */
  public async insertBestGuess(document: bestGuessModel): Promise<string> {
    const bestGuessAlreadyExists = await BestGuessCollection.document({ _key: document._key }, true);
    console.log(`BEST GUESS: ${document._key} : ${document.bestGuess}`);
    return bestGuessAlreadyExists
      ? bestGuessAlreadyExists._id
      : (await BestGuessCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;
  }
}

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

export const bestGuessObject: BestGuessObject = new BestGuessObject();
export const bestGuessOfObject: BestGuessOfObject = new BestGuessOfObject();
