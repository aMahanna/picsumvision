/**
 * This @file manages the Best Guess Document Collection in ArangoDB
 */

import db from '../../database';

interface bestGuessModel {
  _key: string;
  bestGuess: string;
}

const BestGuessCollection = db.collection('BestGuess');

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
    if (bestGuessAlreadyExists) /** @todo remove */ console.log('Duplicate BEST GUESS found: ', bestGuessAlreadyExists._id);
    return bestGuessAlreadyExists
      ? bestGuessAlreadyExists._id
      : (await BestGuessCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;
  }
}

export const bestGuessObject: BestGuessObject = new BestGuessObject();
