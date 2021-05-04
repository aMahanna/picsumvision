/**
 * This @file manages the Images Document Collection in our ArangoDB
 */

import db from '../database';
import { aql } from 'arangojs';
import { response } from 'express';

export interface imageModel {
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
  public async insertImage(document: imageModel): Promise<string | undefined> {
    const imageAlreadyExists = await ImageCollection.document({ _key: document._key }, true);
    return imageAlreadyExists
      ? undefined
      : (
          await ImageCollection.save(
            {
              _key: document._key,
              author: document.author,
              url: document.url,
              date: document.date,
            },
            { waitForSync: true, overwriteMode: 'ignore' },
          )
        )._id;
  }

  /**
   * WORK IN PRGORESS: @method allows the user to query by multiple keys (e.g author, label, color, face,...)
   *
   * @param labels An array of targetted words
   */
  public async query_mixed_keys(TargetLabels: string[]): Promise<{}[] | undefined> {
    try {
      const response = await db.query(aql`
        WITH Labels, Authors
        FOR i IN Images 
          FOR v, e, p IN 1..1 INBOUND i LabelOf, AuthorOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            FOR data IN ${TargetLabels}
              FILTER CONTAINS(v.data, data)
              COLLECT image = i, id = e._to WITH COUNT INTO num
              LET obj = {
                  "url": image.url,
                  "author": image.author,
                  "count": num
              }
              SORT obj.count DESC
              LIMIT 3
              RETURN obj
      `);
      const result = await response.map(doc => doc);
      return result;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  /**
   * WORK IN PRGORESS: @method allows the user to query by STRICT MODE
   *
   * @param labels An array of targetted words that MUST BE ALL IN the IMAGE
   */
  public async query_mixed_keys_strict(TargetLabels: string[]): Promise<{}[] | undefined> {
    try {
      const response = await db.query(aql`
        WITH Labels, Authors
        FOR i IN Images 
          FOR v, e, p IN 1..1 INBOUND i LabelOf, AuthorOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            FOR data IN ${TargetLabels}
              FILTER v.data == data
              COLLECT image = i, id = e._to WITH COUNT INTO num
              LET obj = {
                  "url": image.url,
                  "author": image.author,
                  "count": num
              }
              FILTER obj.count >= ${TargetLabels.length}
              LIMIT 3
              RETURN obj
      `);
      const result = await response.map(doc => doc);
      return result;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  /**
   * WORK IN PRGORESS: @method Returns 3 random labels
   */
  public async fetch_surprise_keys(): Promise<string[] | undefined> {
    try {
      const response = await db.query(aql`
        With Labels, Authors
        FOR i IN Images
          SORT RAND()
          LIMIT 1
          FOR v, e, p IN 1..1 INBOUND i LabelOf, AuthorOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            SORT RAND()
            LIMIT 3
            RETURN v
      `);

      const result = await response.map(doc => doc.data);
      return result;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }
}

export const imageObject: ImageObject = new ImageObject();
