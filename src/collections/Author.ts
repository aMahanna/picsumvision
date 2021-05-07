/**
 * This @file manages the Author & AuthorOf Collections in ArangoDB
 */

import db from '../database';

interface authorModel {
  _key: string;
  name: string;
}

interface authorOfModel {
  _from: string;
  _to: string;
  _score: number;
}

const AuthorCollection = db.collection('Authors');
const AuthorOfCollection = db.collection('AuthorOf');

class AuthorObject {
  /**
   * @method used to insert the Author metadata of a particular image
   * Avoids  duplicates by checking if the name already exists
   *
   * @param document implements the authorModel interface
   * @returns the ArangoID of the Author inserted
   */
  public async insertAuthor(document: authorModel): Promise<string> {
    const authorAlreadyExists = await AuthorCollection.document({ _key: document._key }, true);
    console.log(`LABEL: ${document._key} : ${document.name}`);
    return authorAlreadyExists
      ? authorAlreadyExists._id
      : (await AuthorCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;
  }
}

class AuthorOfObject {
  /**
   * @method inserts the AuthorOf Edge linking an Image and an Author
   *
   * @param edge implements the authorOfModel interface
   * @returns The ArangoID of the inserted AuthorOf edge
   */
  async insertAuthorOf(edge: authorOfModel): Promise<void> {
    await AuthorOfCollection.save(edge, { silent: true });
  }
}

export const authorObject: AuthorObject = new AuthorObject();
export const authorOfObject: AuthorOfObject = new AuthorOfObject();
