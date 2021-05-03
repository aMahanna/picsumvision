/**
 * This @file manages the Labels Document Collection in our ArangoDB
 */

import db from '../../database';
import { aql } from 'arangojs';

export interface labelModel {
  mid: string;
  description: string;
  score: number;
  topicality: number;
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
  public async insertLabel(document: { mid: string; description: string }): Promise<string> {
    const labelExistsQuery = await db.query(aql`
      FOR l IN Labels
      FILTER l.mid == ${document.mid}
      LIMIT 1
      RETURN l
    `);
    const queryResult = await labelExistsQuery.map(doc => doc._id);
    console.log(queryResult.length > 0 ? `Duplicate label found! ${queryResult[0]}` : '');

    return queryResult.length === 0 ? (await LabelCollection.save(document))._id : queryResult[0];
  }
}

export const labelObject: LabelObject = new LabelObject();
