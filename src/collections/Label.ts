/**
 * This @file manages the Label & LabelOf Collections in our ArangoDB
 */

import db from '../database';
import fetch from 'node-fetch';

interface labelModel {
  _key: string;
  mid: string;
  label: string;
  data?: string;
}

interface museModel {
  word: string;
  score?: number;
  tags?: string[];
}

interface labelOfModel {
  _from: string;
  _to: string;
  _score: number;
}

const LabelCollection = db.collection('Labels');
const LabelOfCollection = db.collection('LabelOf');

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
      return labelAlreadyExists._id;
    }
    document.data = await this.generateLabelData(document.label.trim().split(' ').join('+'));
    return (await LabelCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;
  }

  /**
   * @method that attempts to create similar words to the parameter provided.
   * This ideally helps refine searching, but is currently unstable
   * - The contents of the metadata returned do not always match the target word
   * - Currently debating on whether to remove this or not, @todo
   * - Currently using the arbitrary DataMuse 'scoring' mecanism to filter out responses
   *
   * - mlResult: Matches around "means like" results  (e.g ocean -> see)
   * - synResult: Matches around synonyms (e.g boat -> gondola)
   * - trgResult: Matches around "trigger" (e.g cow -> milking)
   * @param word The word to generate more metadata from
   * @returns
   */
  public async generateLabelData(word: string) {
    let mlResult: museModel[] = [];
    let synResult: museModel[] = [];
    let trgResult: museModel[] = [];
    try {
      mlResult = await (await fetch(`https://api.datamuse.com/words?ml=${word}&max=10`)).json();
      synResult = await (await fetch(`https://api.datamuse.com/words?rel_syn=${word}&max=10`)).json();
      trgResult = await (await fetch(`https://api.datamuse.com/words?rel_trg=${word}&max=10`)).json();
    } catch (error: any) {
      return '';
    }

    const labelData: museModel[] = (mlResult.length !== 0 ? mlResult : []).concat(
      synResult.length !== 0 ? synResult : [],
      trgResult.length !== 0 ? trgResult : [],
    );
    return [...new Map(labelData.map(elem => [elem.word, elem.word])).values()].join(' ');
  }
}

class LabelOfObject {
  /**
   * @method inserts the LabelOf Edge linking an Image and a Label metadata
   *
   * @param edge implements the labelOfModel interface
   * @returns The ArangoID of the inserted LabelOf edge
   */
  async insertLabelOf(edge: labelOfModel): Promise<void> {
    await LabelOfCollection.save(edge, { silent: true, waitForSync: true });
  }
}

export const labelObject: LabelObject = new LabelObject();
export const labelOfObject: LabelOfObject = new LabelOfObject();

/**
 * @todo - remove
 * A small function to mess around with the Datamuse API
 */
// (async () => {
//   const labelData = await labelObject.generateLabelData('NYC+Horse+Carriage+Rides+EST.1979');
//   console.log(labelData);
// })();
