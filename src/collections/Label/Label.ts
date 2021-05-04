/**
 * This @file manages the Labels Document Collection in our ArangoDB
 */

import db from '../../database';
import { aql } from 'arangojs';

export interface labelModel {
  _key: string;
  mid: string;
  data: string;
}

const LabelCollection = db.collection('Labels');

class LabelObject {
  /**
   * @method used to insert the label metadata of a particular image
   * Avoids GCP Label duplicates by checking the MID of each label
   *
   * @param document implements the labelModel interface
   * @returns the ArangoID of the Label inserted
   */
  public async insertLabel(document: labelModel): Promise<string> {
    /**
     * @todo - Figure out why ArangoDB is not catching this document check, thus causing a key constraint violation
     */
    //const labelAlreadyExists = await LabelCollection.documentExists({ _key: document._key });
    const query = await db.query(aql`
      INSERT ${document} INTO ${LabelCollection} 
      OPTIONS { ignoreErrors: true }
      RETURN NEW
    `);
    const result = await query.map(doc => doc);
    return result[0] ? result[0]._id : `Labels/${document._key}`;
  }
}

export const labelObject: LabelObject = new LabelObject();
