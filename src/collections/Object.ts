/**
 * This @file manages the Object & ObjectOf Collections in ArangoDB
 */

import db from '../database';

interface objectModel {
  _key: string;
  mid: string;
  object: string;
}

interface objectOfModel {
  _from: string;
  _to: string;
  _score: number;
  _coord: number[][];
}

const ObjectCollection = db.collection('Object');
const ObjectOfCollection = db.collection('ObjectOf');

class ObjectController {
  /**
   * @method used to insert the Vision Object metadata of a particular image
   * Avoids  duplicates by checking if the object already exists
   *
   * @param document implements the buestGuessModel interface
   * @returns the ArangoID of the Object inserted
   */
  public async insert(document: objectModel): Promise<string> {
    const existingObject = await ObjectCollection.document({ _key: document._key }, true);
    return existingObject
      ? existingObject._id
      : (await ObjectCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;
  }

  public async exists(_key: string): Promise<boolean> {
    return (await ObjectCollection.document({ _key }, true)) ? true : false;
  }
}

class ObjectOfController {
  /**
   * @method inserts the ObjectOf Edge linking an Image and a Vision Object
   *
   * @param edge implements the objectOfModel interface
   */
  async insert(edge: objectOfModel): Promise<void> {
    await ObjectOfCollection.save(edge, { silent: true });
  }
}

export const objectController: ObjectController = new ObjectController();
export const objectOfController: ObjectOfController = new ObjectOfController();
