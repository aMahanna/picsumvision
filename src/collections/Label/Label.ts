/**
 * This @file manages the Labels Document Collection in our ArangoDB
 */

import db from '../../database';

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
    const labelAlreadyExists = await LabelCollection.document({ _key: document._key }, true);
    if (labelAlreadyExists) /** @todo remove */ console.log('Duplicate LABEL found: ', labelAlreadyExists._id);
    return labelAlreadyExists
      ? labelAlreadyExists._id
      : (await LabelCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;
  }
}

export const labelObject: LabelObject = new LabelObject();
