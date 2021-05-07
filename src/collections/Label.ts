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
      console.log('Duplicate LABEL found: ', labelAlreadyExists._id); /** @todo remove */
      return labelAlreadyExists._id;
    }
    document.data = await this.generateLabelData(document.label.trim());
    return (await LabelCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;
  }

  /**
   * A WIP @method that attempts to create similar words to the parameter provided.
   * This ideally helps refine searching, but is currently unstable
   * - The contents of the metadata returned do not always match the target word
   * - Currently debating on whether to remove this or not, @todo
   * - Currently using the arbitrary DataMuse 'scoring' mecanism to filter out responses
   *
   * - mlResult: Matches around "means like" results  (e.g person -> someone)
   * - trgResult: Matches around "trigger" (e.g cow -> milking)
   * - gnResult: Matches around "more general than" (e.g boat -> gondola)
   * @param word The word to generate more metadata from
   * @returns
   */
  private async generateLabelData(word: string) {
    const mlResult: museModel[] = await (await fetch(`https://api.datamuse.com/words?ml=${word}&max=1`)).json();
    const gnResult: museModel[] = await (await fetch(`https://api.datamuse.com/words?rel_gen=${word}&max=1`)).json();
    const trgResult: museModel[] = await (await fetch(`https://api.datamuse.com/words?rel_trg=${word}&max=1`)).json();
    const labelData: museModel[] = (mlResult[mlResult.length - 1] && mlResult[mlResult.length - 1].score! > 40000
      ? mlResult
      : []
    ).concat(
      gnResult[gnResult.length - 1] && gnResult[gnResult.length - 1].score! > 4000 ? gnResult : [],
      trgResult[trgResult.length - 1] && trgResult[trgResult.length - 1].score! > 1500 ? trgResult : [],
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
    await LabelOfCollection.save(edge, { silent: true });
  }
}

export const labelObject: LabelObject = new LabelObject();
export const labelOfObject: LabelOfObject = new LabelOfObject();

// For testing: @todo remove
// (async () => {
//   const labelData = await labelObject.generateLabelData('MacBook Air');
//   console.log(labelData);
// })();
