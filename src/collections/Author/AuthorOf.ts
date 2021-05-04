/**
 * This @file manages the LabelOf Edge Collection in our ArangoDB
 */

import db from '../../database';

export interface authorOfModel {
  _from: string;
  _to: string;
  _score: number;
}

const AuthorOfCollection = db.collection('AuthorOf');

class AuthorOfObject {
  /**
   * @method inserts the AuthorOf Edge linking an Image and an Author
   *
   * @param edge implements the authorOfModel interface
   * @returns The ArangoID of the inserted AuthorOf edge
   */
  async insertAuthorOf(edge: authorOfModel) {
    const result = await AuthorOfCollection.save(edge);
    return result._id;
  }
}

export const authorOfObject: AuthorOfObject = new AuthorOfObject();
