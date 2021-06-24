/**
 * This @file manages the Object & ObjectOf Collections in ArangoDB
 */

import db from '../database';

interface landmarkModel {
  _key: string;
  mid: string;
  landmark: string;
}

interface landmarkOfModel {
  _from: string;
  _to: string;
  _score: number;
  _latitude: number;
  _longitude: number;
}

const LandmarkCollection = db.collection('Landmark');
const LandmarkOfCollection = db.collection('LandmarkOf');

class LandmarkController {
  /**
   * @method used to insert the Vision Landmark metadata of a particular image
   * Avoids  duplicates by checking if the object already exists
   *
   * @param document implements the buestGuessModel interface
   * @returns the ArangoID of the Landmark inserted
   */
  public async insert(document: landmarkModel): Promise<string> {
    const existingLandmark = await LandmarkCollection.document({ _key: document._key }, true);
    return existingLandmark
      ? existingLandmark._id
      : (await LandmarkCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;
  }

  public async exists(_key: string): Promise<boolean> {
    return (await LandmarkCollection.document({ _key }, true)) ? true : false;
  }
}

class LandmarkOfController {
  /**
   * @method inserts the LandmarkOf Edge linking an Image and a Vision Landmark
   *
   * @param edge implements the landmarkOfModel interface
   */
  async insert(edge: landmarkOfModel): Promise<void> {
    await LandmarkOfCollection.save(edge, { silent: true });
  }
}

export const landmarkController: LandmarkController = new LandmarkController();
export const landmarkOfController: LandmarkOfController = new LandmarkOfController();
