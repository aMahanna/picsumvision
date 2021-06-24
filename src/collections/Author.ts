/**
 * This @file manages the Author & AuthorOf Collections in ArangoDB
 */

import db from '../database';

interface authorModel {
  _key: string;
  author: string;
}

interface authorOfModel {
  _from: string;
  _to: string;
  _score: number;
}

const AuthorCollection = db.collection('Author');
const AuthorOfCollection = db.collection('AuthorOf');

class AuthorController {
  /**
   * @method used to insert the Author metadata of a particular image
   * Avoids  duplicates by checking if the name already exists
   *
   * @param document implements the authorModel interface
   * @returns the ArangoID of the Author inserted
   */
  public async insert(document: authorModel): Promise<string> {
    const existingAuthor = await AuthorCollection.document({ _key: document._key }, true);
    return existingAuthor
      ? existingAuthor._id
      : (await AuthorCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;
  }
}

class AuthorOfController {
  /**
   * @method inserts the AuthorOf Edge linking an Image and an Author
   *
   * @param edge implements the authorOfModel interface
   */
  async insert(edge: authorOfModel): Promise<void> {
    await AuthorOfCollection.save(edge, { silent: true });
  }
}

export const authorController: AuthorController = new AuthorController();
export const authorOfController: AuthorOfController = new AuthorOfController();
