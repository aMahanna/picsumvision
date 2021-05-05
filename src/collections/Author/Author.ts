/**
 * This @file manages the Labels Document Collection in our ArangoDB
 */

import db from '../../database';
import { aql } from 'arangojs';

export interface authorModel {
  _key: string;
  data: string;
  nameSplit: string[];
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
    /**
     * @todo - Figure out why ArangoDB is not catching this document check, thus causing a key constraint violation
     */
    // const authorAlreadyExists = await AuthorCollection.document({ _key: document._key }, true);
    // if (authorAlreadyExists) /** @todo remove */ console.log('Duplicate AUTHOR found: ', authorAlreadyExists._id);
    // return authorAlreadyExists
    //   ? authorAlreadyExists._id
    //   : (await AuthorCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;

    const query = await db.query(aql`
      INSERT ${document} INTO ${AuthorCollection} 
      OPTIONS { ignoreErrors: true }
      RETURN NEW
    `);
    const result = await query.map(doc => doc);
    return result[0] ? result[0]._id : `Authors/${document._key}`;
  }
}

export const authorObject: AuthorObject = new AuthorObject();
