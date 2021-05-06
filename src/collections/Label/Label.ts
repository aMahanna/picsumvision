/**
 * This @file manages the Labels Document Collection in our ArangoDB
 */

import db from '../../database';
import fetch from 'node-fetch';

interface labelModel {
  _key: string;
  mid: string;
  label: string;
  data?: any; // @todo update
}

interface datamuseModel {
  word: string;
  score?: number;
  tags?: string[];
}

const LabelCollection = db.collection('Labels');

class LabelObject {
  /**
   * @method used to insert the label metadata of a particular image
   * Avoids Vision Label duplicates by checking the MID of each label
   *
   * @param document implements the labelModel interface
   * @returns the ArangoID of the Label inserted
   */
  public async insertLabel(document: labelModel): Promise<string> {
    const labelAlreadyExists = await LabelCollection.document({ _key: document._key }, true);
    if (labelAlreadyExists) {
      console.log('Duplicate LABEL found: ', labelAlreadyExists._id); /** @todo remove */
      return labelAlreadyExists._id;
    }
    document.data = await this.generateLabelData(document.label);
    return (await LabelCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;
  }

  /**
   * A WIP @method that attempts to create similar words to the parameter provided.
   * This ideally helps refine searching, but is currently unstable
   * - The contents of the metadata returned do not always match the target word
   * - Currently debating on whether to remove this or not, @todo
   *
   *
   * - mlResult: Matches around "means like" results  (e.g person -> someone)
   * - trgResult: Matches around "trigger" (e.g cow -> milking)
   * - gnResult: Matches around "more general than" (e.g boat -> gondola)
   * @param word The word to generate more metadata from
   * @returns
   */
  public async generateLabelData(word: string) {
    const mlResult: datamuseModel[] = await (await fetch(`https://api.datamuse.com/words?ml=${word}&max=1`)).json();
    const trgResult: datamuseModel[] = await (await fetch(`https://api.datamuse.com/words?rel_trg=${word}&max=1`)).json();
    const gnResult: datamuseModel[] = await (await fetch(`https://api.datamuse.com/words?rel_gen=${word}&max=1`)).json();
    const labelData: datamuseModel[] = mlResult.concat(trgResult, gnResult);
    return [...new Map(labelData.map(elem => [elem.word, elem.word])).values()].join(' ');
  }
}

export const labelObject: LabelObject = new LabelObject();
// (async () => {
//   const labelData = await labelObject.generateLabelData('plant');
//   console.log(labelData);
// })();
