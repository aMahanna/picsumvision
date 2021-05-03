/**
 * This @file manages the Images Document Collection in our ArangoDB
 */

import db from '../database';
import { aql } from 'arangojs';

export interface imageModel {
  id: number;
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
  public async insertImage(document: imageModel): Promise<string> {
    const imageExitsQuery = await db.query(aql`
    FOR i IN Images
    FILTER i._key == ${document.id}
    LIMIT 1
    RETURN i
  `);
    const queryResult = await imageExitsQuery.map(doc => doc._id);
    console.log(queryResult.length > 0 ? `Duplicate image found! ${queryResult[0]}` : '');

    return queryResult.length === 0
      ? (
          await ImageCollection.save({
            _key: `${document.id}`,
            author: document.author,
            url: document.url,
            date: document.date,
          })
        )._id
      : queryResult[0];
  }

  /**
   * A temporary @method to test out the application API
   *
   * @param key
   * @param value
   */
  public async simpleQuery(key: string, value: string): Promise<{}[]> {
    const query = await db.query(aql`
    FOR i IN Images
    FILTER i[${key}] LIKE ${value}
    RETURN i
  `);
    const result = await query.map(doc => {
      return {author: doc.author, url: doc.url}
    });
    return result;
  }

  // public truncate()  {
  //   ImageCollection.truncate();
  // }
}

export const imageObject: ImageObject = new ImageObject();
