/**
 * This @file manages the Images Document Collection in our ArangoDB
 */

import db from '../database';
import { aql } from 'arangojs';

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
      const looseMatches = await (
        await db.query(aql`
        WITH Labels, Authors
        FOR i IN Images 
          FOR v, e, p IN 1..1 INBOUND i LabelOf, AuthorOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            FOR data IN ${TargetLabels}
              FILTER CONTAINS(LOWER(v.data), LOWER(data))
              COLLECT image = i, id = e._to WITH COUNT INTO num
              LET obj = {
                  "url": image.url,
                  "author": image.author,
                  "count": num
              }
              SORT obj.count DESC
              LIMIT 6
              RETURN obj
      `)
      ).all();

      const exactAuthorMatches = await (
        await db.query(aql`
        FOR doc IN ${looseMatches}
          FOR data IN ${TargetLabels}
          FILTER LOWER(SUBSTITUTE(doc.author, " ", "")) == LOWER(data)
          SORT doc.author DESC
          RETURN doc
      `)
      ).all();

      const finalResult = await (
        await db.query(aql`
          RETURN UNIQUE(APPEND(${exactAuthorMatches},${looseMatches}))
      `)
      ).all();
      return finalResult[0];
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
      const strictMatches = await (
        await db.query(aql`
        WITH Labels, Authors
        FOR i IN Images 
          FOR v, e, p IN 1..1 INBOUND i LabelOf, AuthorOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            FOR data IN ${TargetLabels}
              FILTER LOWER(v.data) == LOWER(data)
              COLLECT image = i, id = e._to WITH COUNT INTO num
              LET obj = {
                  "url": image.url,
                  "author": image.author,
                  "count": num
              }
              FILTER obj.count >= ${TargetLabels.length}
              LIMIT 3
              SORT RAND()
              RETURN obj
      `)
      ).all();

      return strictMatches;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  /**
   * WORK IN PRGORESS: @method Returns a max of 4 random labels for user input
   */
  public async fetch_surprise_keys(): Promise<string[] | undefined> {
    try {
      const result = await (
        await db.query(aql`
        With Labels, Authors
        FOR i IN Images
          SORT RAND()
          LIMIT 1
          FOR v, e, p IN 1..1 INBOUND i LabelOf, AuthorOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            SORT RAND()
            LIMIT 3
            SORT v.data
            RETURN LOWER(v.data)
      `)
      ).all();

      return result;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  /**
   * WORK IN PRGORESS: @method Returns a max of 4 random labels for user input
   */
  public async fetch_image_info(id: string): Promise<{}[] | undefined> {
    try {
      const result = await (
        await db.query(aql`
        WITH Labels
        Let image = FIRST((
          FOR i IN Images
          FILTER i._key == ${id}
          LIMIT 1
          RETURN i
        ))
        Let labels = (
          FOR v, e, p IN 1..1 ANY image LabelOf OPTIONS {bfs: true, uniqueVertices: 'global' }
          FILTER e._from == v._id
          SORT e._score DESC
          RETURN {score: e._score, data: v.data}
        )
        RETURN {image, labels}
      `)
      ).all();

      return result[0];
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }
}

export const imageObject: ImageObject = new ImageObject();
