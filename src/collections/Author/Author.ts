/**
 * This @file manages the Labels Document Collection in our ArangoDB
 */

import db from '../../database';
import { aql } from 'arangojs';

export interface authorModel {
  fullName: string;
  data: string[];
}

const AuthorCollection = db.collection('Authors');

class AuthorObject {
  /**
   * @method used to insert the Author metadata of a particular image
   * Avoids  duplicates by checking if the name already exists
   *
   * @param document implements the authorModel interface
   * @returns the ArangoID of the Author inserted
   */
  public async insertAuthor(document: authorModel): Promise<string> {
    const authorExistsQuery = await db.query(aql`
      FOR a IN Authors
      FILTER a.fullName == ${document.fullName}
      LIMIT 1
      RETURN a
    `);
    const queryResult = await authorExistsQuery.map(doc => doc._id);
    console.log(queryResult.length > 0 ? `Duplicate author found! ${queryResult[0]}` : '');

    return queryResult.length === 0 ? (await AuthorCollection.save(document))._id : queryResult[0];
  }
}

export const authorObject: AuthorObject = new AuthorObject();
