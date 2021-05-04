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
   * WORK IN PRGORESS: @method allows the user to query by multiple keys (e.g author, label, color, face,...)
   *
   * @param labels An array of targetted words
   */
  public async query_mixed_keys(Labels: string[]): Promise<{}[]> {
    const response = await db.query(aql`
      WITH Labels, Authors
      FOR i IN Images 
        FOR v, e, p IN 1..1 INBOUND i LabelOf, AuthorOf 
          FOR data IN ${Labels}
            FILTER CONTAINS(v.data, data)
            COLLECT id = e._to WITH COUNT INTO num
            LET image = DOCUMENT(id)
            LET obj = {
                "url": image.url,
                "author": image.author,
                "count": num
            }
            SORT obj.count DESC
            RETURN obj
    `);
    const result = await response.map(doc => doc);
    return result;
  }
}

export const imageObject: ImageObject = new ImageObject();
