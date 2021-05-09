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
import sampleVisionLabels from '../assets/sampleVisionLabels';
// Import the interfaces used
import { VisionAnnotation, PicsumImage } from '../interfaces';

// Import the current ArangoDB Collections in-use
import { imageObject } from '../collections/Image';
import { labelObject, labelOfObject } from '../collections/Label';
import { authorObject, authorOfObject } from '../collections/Author';
import { bestGuessObject, bestGuessOfObject } from '../collections/BestGuess';

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
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
  let _key = '';
  data.split('').forEach(char => {
    _key += char.charCodeAt(0);
  });
  return _key;
}

/**
 * @method handles DB data insertion
 * - Fetches all 993 Picsum Images
 * - Calls the Vision API on each one of them to create metadata
 * - Parse through the metadata and insert correspondingly in ArangoDB
 */
async function populateDB() {
  const limit = 100; // The number of images to return per page (max 100)

  let PICSUM_LIST: PicsumImage[] = [];
  let PICSUM_RESULT: PicsumImage[] = [];
  let pageCount = 1;
  do {
    const PICSUM_RESPONSE = await fetch(`https://picsum.photos/v2/list?page=${pageCount}&limit=${limit}`);
    PICSUM_RESULT = await PICSUM_RESPONSE.json();

    PICSUM_LIST = PICSUM_LIST.concat(PICSUM_RESULT);
    pageCount++;
  } while (pageCount !== 2); // pageCount !== 2 --> Generates only the first LIMIT images

  for (let j = 0; j < PICSUM_LIST.length; j++) {
    const PICSUM_IMAGE: PicsumImage = PICSUM_LIST[j];
    const PICSUM_URL = PICSUM_IMAGE.download_url;

    const VISION_DATA = await fetchVisionMetadata(PICSUM_URL);
    if (!VISION_DATA || VISION_DATA.error) {
      console.log('Vision uncooperative, skipping...', VISION_DATA?.error);
      continue; // Exit early if Vision hits an error
    }

    /**
     * @this Inserts the Image document, and returns its ID
     * If the image already exists, return the existing ID
     */
    const imageID = await imageObject.insertImage({
      _key: String(PICSUM_IMAGE.id),
      author: PICSUM_IMAGE.author,
      url: PICSUM_URL,
      date: Date(),
    });

    /**
     * @this Inserts an Author document, and links the image using an AuthorOf edge
     * @returns AUTHOR IDs
     */
    const authorID = await authorObject.insertAuthor({
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
    const visionAnnotations = VISION_DATA.labelAnnotations
      ?.concat(
        VISION_DATA.localizedObjectAnnotations ? VISION_DATA.localizedObjectAnnotations : [],
        VISION_DATA.webDetection?.webEntities ? VISION_DATA.webDetection.webEntities : [],
      )
      .sort((a: VisionAnnotation, b: VisionAnnotation) => (a.score > b.score ? -1 : a.score === b.score ? 0 : 1));

    const uniqueAnnotations = [
      ...new Map(visionAnnotations.map((elem: VisionAnnotation) => [(elem.mid || elem.entityId)!, elem])).values(),
    ];

    for (let t = 0; t < uniqueAnnotations.length; t++) {
      const annot = uniqueAnnotations[t];
      const id = (annot.mid || annot.entityId)!;
      const label = (annot.description || annot.name)!;

      const labelID = await labelObject.insertLabel({
        _key: stringToASCII(id),
        mid: id,
        label,
      });
      await labelOfObject.insertLabelOf({
        _from: labelID,
        _to: imageID,
        _score: annot.score,
      });
    }

    /**
     * @this Inserts the Best Guess documents, and links the image using BestGuessOf edges
     * @returns "BestGuess" IDs
     */
    const bestGuesses = VISION_DATA.webDetection?.bestGuessLabels;
    for (let y = 0; y < bestGuesses.length; y++) {
      const guess = bestGuesses[y];

      const bestGuessID: string = await bestGuessObject.insertBestGuess({
        _key: stringToASCII(guess.label.toLowerCase()),
        bestGuess: guess.label,
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
