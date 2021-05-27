/**
 * This @file manages the Images Document Collection in ArangoDB
 */

import { ArangoImage } from '../interfaces';
import db from '../database';

interface imageModel {
  _key: string;
  author: string;
  url: string;
  date: string;
}

const ImageCollection = db.collection('Images');

class ImageObject {
  /**
   * @method used to insert the Picsum images generated from the `yarn picsum` script
   * Avoids Picsum image duplicates by checking the ID of each Picsum Image
   *
   * @param document implements the imageModel interface
   * @returns the ArangoID of the Image inserted
   */
  public async insertImage(document: imageModel): Promise<{ id: string; alreadyExists?: true }> {
    const imageAlreadyExists: ArangoImage = await ImageCollection.document({ _key: document._key }, true);
    if (imageAlreadyExists) return { id: imageAlreadyExists._id, alreadyExists: true };
    else {
      const insert = await ImageCollection.save(document, { overwriteMode: 'ignore', waitForSync: true });
      return { id: insert._id };
    }
  }

  /**
   * @method used to remove an image
   * This is currently only in use for when the Vision API has returned no metadata for an inserted image
   *
   * @param the id of the image
   */
  public async removeImage(id: string): Promise<void> {
    await ImageCollection.remove(id, { waitForSync: true });
  }
}

export const imageObject: ImageObject = new ImageObject();
