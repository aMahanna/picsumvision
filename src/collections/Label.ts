/**
 * This @file manages the Label & LabelOf Collections in our ArangoDB
 */

import db from '../database';
import fetch from 'node-fetch';
import { URL } from 'url';

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

const LabelCollection = db.collection('Label');
const LabelOfCollection = db.collection('LabelOf');

class LabelController {
  /**
   * @method used to insert the label metadata of a particular image
   * Avoids Vision Label duplicates by checking the MID of each label
   *
   * @param document implements the labelModel interface
   * @returns the ArangoID of the Label inserted
   */
  public async insert(document: labelModel): Promise<string> {
    const existingLabel = await LabelCollection.document({ _key: document._key }, true);
    if (existingLabel) {
      // const newData = await this.generateLabelData(document.label, labelTopic);
      // await LabelCollection.update(document._key, { data: newData + ' ' + existingLabel.data }, { waitForSync: true });
      return existingLabel._id;
    }

    // document.data = await this.generateLabelData(document.label, labelTopic);
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
  public async generateLabelData(word: string, topics: string): Promise<string> {
    topics = topics.trim();
    word = word.trim().replace(' ', '%20');

    let datamuseLabels: museModel[] = [];
    const datamuseParams = ['ml', 'rel_spc', 'rel_com', 'rel_gen', 'rel_trg'];

    try {
      for (const param of datamuseParams) {
        const data = await (await fetch(new URL(`https://api.datamuse.com/words?${param}=${word}&topics=${topics}`))).json();
        // console.log(param + ': ' + data.slice(0,3).map(elem => elem.word));
        datamuseLabels = datamuseLabels.concat(data.slice(0, 3));
      }
    } catch (error) {
      console.log('Error: ', error); // eslint-disable-line no-console
    }

    return [...new Map(datamuseLabels.map(elem => [elem.word, elem.word])).values()].join(' ');
  }
}

class LabelOfController {
  /**
   * @method inserts the LabelOf Edge linking an Image and a Label metadata
   *
   * @param edge implements the labelOfModel interface
   * @returns The ArangoID of the inserted LabelOf edge
   */
  async insert(edge: labelOfModel): Promise<void> {
    await LabelOfCollection.save(edge, { silent: true, waitForSync: true });
  }
}

export const labelController: LabelController = new LabelController();
export const labelOfController: LabelOfController = new LabelOfController();

/**
 * @todo - remove
 * A small function to mess around with the Datamuse API
 */
// (async () => {
//   const labelData = await labelObject.generateLabelData('Cloud', 'Cloud');
//   console.log(labelData);
// })();
