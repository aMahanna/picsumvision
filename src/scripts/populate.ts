/**
 * @file A script to populare the database
 *
 * - Fetches the 993 Picsum images
 * - Calls the Vision API for each image to create its metadata
 * - Inserts the image as well as author & label documents / edges into ArrangoDB
 * - Prints a success message on every iteration if all data is inserted
 */

import '../database';
import fetch from 'node-fetch';

// Import the Vision API
import fetchVisionMetadata from '../vision';
// Import the test data (optional)
import VISION_TEST_LABELS from './assets/VISION_TEST_LABELS';
// Import the interfaces used
import { VisionAnnotation, PicsumImage } from '../interfaces';

// Import the current ArangoDB Collections in-use
import { imageObject } from '../collections/Image';
import { labelObject, labelOfObject } from '../collections/Label';
import { authorObject, authorOfObject } from '../collections/Author';
import { bestGuessObject, bestGuessOfObject } from '../collections/BestGuess';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

/**
 * Converts the passed metadata value into ASCII code
 * Used to create predictable/unique _key values for ArangoDB
 *
 * @param data A string representing the metadata value
 * @returns the string in ASCII code
 */
function stringToASCII(data: string): string {
  let _key: string = '';
  data.split('').forEach(char => {
    _key += char.charCodeAt(0);
  });
  return _key;
}

async function populateDB() {
  // number of picsum images: ~1000
  const limit: number = 50;
  const maxResults: number = 2;

  let PICSUM_LIST: PicsumImage[] = [];
  let PICSUM_RESULT: PicsumImage[] = [];
  let pageCount = 1;
  do {
    // const PICSUM_LIST_RESPONSE = await fetch(`https://picsum.photos/id/1048/info/`); // Used for testing
    const PICSUM_RESPONSE = await fetch(`https://picsum.photos/v2/list?page=${pageCount}&limit=${limit}`);
    PICSUM_RESULT = await PICSUM_RESPONSE.json();

    PICSUM_LIST = PICSUM_LIST.concat(PICSUM_RESULT);
    pageCount++;
  } while (pageCount !== 2); // pageCount !== 2 --> Generates only the first LIMIT images

  for (let j = 0; j < PICSUM_LIST.length; j++) {
    const PICSUM_IMAGE: PicsumImage = PICSUM_LIST[j];
    const PICSUM_URL: string = PICSUM_IMAGE.download_url;

    const VISION_DATA = await fetchVisionMetadata(PICSUM_URL, maxResults);
    if (!VISION_DATA || VISION_DATA.error) {
      // Exit early if Vision does not find anything
      console.log('VISION API UNCOOPERATIVE; SKIPPING...');
      console.log(VISION_DATA);
      return undefined;
    }

    // console.log(`URL: ${PICSUM_URL}`);
    // console.dir(VISION_DATA, { depth: null });

    /**
     * @this Inserts the Image document, and returns its ID
     * If the image already exists, it will return UNDEFINED instead, therefore skipping
     * this iteration of the loop
     */
    const imageID: string | undefined = await imageObject.insertImage({
      _key: String(PICSUM_IMAGE.id),
      author: PICSUM_IMAGE.author,
      url: PICSUM_URL,
      date: Date(),
    });
    if (!imageID) {
      console.log('DUPLICATE IMAGE FOUND; SKIPPING...');
      continue;
    }

    /**
     * @this Inserts an Author document, and links the image using an AuthorOf edge
     * @returns AUTHOR IDs
     */
    const authorID: string = await authorObject.insertAuthor({
      _key: stringToASCII(PICSUM_IMAGE.author),
      name: PICSUM_IMAGE.author,
    });
    await authorOfObject.insertAuthorOf({
      _from: authorID,
      _to: imageID,
      _score: 1,
    });

    /**
     * @this Inserts Label documents, and links the image using LabelOf edges
     * @returns "LABEL" IDs
     */
    // Parse, sort & unify the metadata to ensure there are no conflicting values
    const VISION_ANNOTATIONS: VisionAnnotation[] = VISION_DATA.labelAnnotations
      ?.concat(
        VISION_DATA.localizedObjectAnnotations ? VISION_DATA.localizedObjectAnnotations : [],
        VISION_DATA.webDetection?.webEntities ? VISION_DATA.webDetection.webEntities : [],
      )
      .sort((a: VisionAnnotation, b: VisionAnnotation) => (a.score > b.score ? -1 : a.score === b.score ? 0 : 1));
    const UNIQUE_LABELS: VisionAnnotation[] = [
      ...new Map(VISION_ANNOTATIONS.map((elem: VisionAnnotation) => [(elem.mid || elem.entityId)!, elem])).values(),
    ];

    for (let t = 0; t < UNIQUE_LABELS.length; t++) {
      const elem: VisionAnnotation = UNIQUE_LABELS[t];
      if (elem.score > 0.7) {
        const id: string = (elem.mid || elem.entityId)!;
        const label: string = (elem.description || elem.name)!;
        const labelID: string = await labelObject.insertLabel({
          _key: stringToASCII(id),
          mid: id,
          label,
        });
        await labelOfObject.insertLabelOf({
          _from: labelID,
          _to: imageID,
          _score: elem.score,
        });
      }
    }
    /**
     * @this Inserts the Best Guess documents, and links the image using BestGuessOf edges
     * @returns "BestGuess" IDs
     */
    const BEST_GUESSES: { label: string; languageCode: string }[] = VISION_DATA.webDetection?.bestGuessLabels;
    for (let y = 0; y < BEST_GUESSES.length; y++) {
      const elem = BEST_GUESSES[y];
      const bestGuessID: string = await bestGuessObject.insertBestGuess({
        _key: stringToASCII(elem.label),
        bestGuess: elem.label,
      });
      await bestGuessOfObject.insertBestGuessOf({
        _from: bestGuessID,
        _to: imageID,
        _score: 1,
      });
    }

    console.log(`${imageID} complete`);
  }

  console.log('Success: Populating DB complete.');
}

populateDB();
