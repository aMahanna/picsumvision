/**
 * This @file manages the Tag & TagOf Collections in our ArangoDB
 */

import db from '../database';
import fetch from 'node-fetch';
import { URL } from 'url';

interface tagModel {
  _key: string;
  tag: string;
  mid?: string;
  hex?: string;
  datamuse?: string;
}

interface tagOfModel {
  _key: string;
  _from: string;
  _to: string;
  _type: string;
  _score: number;
  _coord?: number[][];
  _latitude?: number;
  _longitude?: number;
  _pixelFraction?: number;
}

interface datamuseModel {
  word: string;
  score?: number;
  tags?: string[];
}

const TagCollection = db.collection('Tag');
const TagOfCollection = db.collection('TagOf');

class TagController {
  /**
   * @method used to insert the label metadata of a particular image
   * Avoids Vision Label duplicates by checking the MID of each label
   *
   * @param document implements the labelModel interface
   * @returns the ArangoID of the Label inserted
   */
  public async insert(document: tagModel): Promise<string> {
    const existingTag = await TagCollection.document({ _key: document._key }, true);
    if (existingTag) return existingTag._id;

    return (await TagCollection.save(document, { waitForSync: true, overwriteMode: 'ignore' }))._id;
  }

  public async exists(_key: string): Promise<boolean> {
    return (await TagCollection.document({ _key }, true)) ? true : false;
  }

  /**
   * @OutOfOrder due to inconsistency :(
   *
   *
   * @method that attempts to create similar words to the parameter provided.
   * This ideally helps refine searching, but is currently unstable
   * - The contents of the metadata returned do not always match the target word
   * - Currently debating on whether to remove this or not, @todo
   * - Currently using the arbitrary DataMuse 'scoring' mecanism to filter out responses
   *
   * - ml: Matches around "means like" results  (e.g ocean -> see)
   * - rel_syn: Matches around synonyms (e.g boat -> gondola)
   * - rel_trg: Matches around "trigger" (e.g cow -> milking)
   * @param word The word to generate more metadata from
   * @returns
   */
  public async generateLabelData(word: string, topics: string): Promise<string> {
    let datamuseLabels: datamuseModel[] = [];
    const datamuseParams = ['ml', 'rel_spc', 'rel_com', 'rel_gen', 'rel_trg'];

    try {
      for (const param of datamuseParams) {
        const data = await (await fetch(new URL(`https://api.datamuse.com/words?${param}=${word}&topics=${topics}`))).json();
        datamuseLabels = datamuseLabels.concat(data.slice(0, 3));
      }
    } catch (error) {
      console.log('Error: ', error); // eslint-disable-line no-console
    }

    return [...new Map(datamuseLabels.map(elem => [elem.word, elem.word])).values()].join(' ');
  }
}

class TagOfController {
  /**
   * @method inserts the TagOf Edge linking an Image and a Label metadata
   *
   * @param edge implements the tagOfModel interface
   * @returns The ArangoID of the inserted TagOf edge
   */
  public async insert(edge: tagOfModel): Promise<void> {
    await TagOfCollection.save(edge, { silent: true, waitForSync: true, overwriteMode: 'ignore' });
  }
}

export const tagController: TagController = new TagController();
export const tagOfController: TagOfController = new TagOfController();

/**
 * @todo - remove
 * A small function to mess around with the Datamuse API
 */
// (async () => {
//   const labelData = await labelObject.generateLabelData('Cloud', 'Cloud');
//   console.log(labelData);
// })();
