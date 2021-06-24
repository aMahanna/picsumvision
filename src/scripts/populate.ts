/* eslint-disable no-console */
/**
 * @file A script to populare the database
 *
 * - Fetches the 993 Picsum images
 * - Calls the Vision API for each image to create its metadata
 * - Inserts the image as well as author & tags documents / edges into ArrangoDB
 * - Prints a success message on every iteration if all data is inserted
 */

import '../database';
import fetch from 'node-fetch';

// Import the Vision API
import fetchVisionMetadata from '../vision';
// Import the interfaces used
import { VisionAnnotation, PicsumImage } from '../interfaces';

// Import the current ArangoDB Collections in-use
import { imageController } from '../collections/Image';
import { authorController, authorOfController } from '../collections/Author';
import { tagController, tagOfController } from '../collections/Tag';
import { bestGuessController, bestGuessOfController } from '../collections/BestGuess';

// Import assets
import ignoredwords from '../assets/misc/ignoredwords';

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
  data
    .trim()
    .split('')
    .forEach(char => {
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
  } while (PICSUM_RESULT.length !== 0 && pageCount !== 2); /** @attention Remove `&& pageCount !== 2` to get all +990 images */

  console.log(`Generating metadata for ${PICSUM_LIST.length} images. Please standby...`);
  for (const PICSUM_IMAGE of PICSUM_LIST) {
    const PICSUM_URL = PICSUM_IMAGE.download_url;

    /**
     * @this Inserts the Image document, and returns its ID
     * If the image already exists, return the existing ID
     */
    const image = await imageController.insert({
      _key: String(PICSUM_IMAGE.id),
      author: PICSUM_IMAGE.author,
      url: PICSUM_URL,
      date: Date(),
    });

    const imageID = image.id;
    const imageKey = image.id.split('/')[1];
    if (image.alreadyExists) {
      console.log(`Duplicate image: ${imageID}, skipping...`);
      continue; // Skip the image if it is already inserted
    }

    const VISION_DATA = await fetchVisionMetadata(PICSUM_URL);
    if (!VISION_DATA || VISION_DATA.error) {
      await imageController.remove(imageID);
      console.log('Vision uncooperative, skipping...', VISION_DATA?.error);
      continue; // Exit early if Vision hits an error
    }

    /**
     * @Author & @AuthorOf Collection Logic
     */
    if (PICSUM_IMAGE.author) {
      const authorID = await authorController.insert({
        _key: stringToASCII(PICSUM_IMAGE.author),
        author: PICSUM_IMAGE.author,
      });

      await authorOfController.insert({
        _from: authorID,
        _to: imageID,
        _score: 2,
      });
    }

    /**
     * VISION LANDMARK ANNOTATIONS (@Tag & @TagOf Collection Logic)
     */
    const LANDMARK_DATA = VISION_DATA.landmarkAnnotations;
    if (LANDMARK_DATA) {
      for (const landmark of LANDMARK_DATA) {
        if (landmark.description && landmark.mid && landmark.score >= 0.2) {
          const _key = stringToASCII(landmark.description);
          const _score = landmark.score > 1 ? 0.99999 : landmark.score;
          const _latitude: number = landmark.locations ? landmark.locations[0].latLng.latitude : 0;
          const _longitude: number = landmark.locations ? landmark.locations[0].latLng.longitude : 0;

          const landmarkID = await tagController.insert({
            _key: _key,
            mid: landmark.mid,
            tag: landmark.description,
          });

          await tagOfController.insert({
            _type: 'landmark',
            _key: _key + imageKey,
            _from: landmarkID,
            _to: imageID,
            _score: _score,
            _latitude: _latitude,
            _longitude: _longitude,
          });
        }
      }
    }

    /**
     * VISION LOCALIZED OBJECT ANNOTATIONS (@Tag & @TagOf Collection Logic)
     */
    const OBJECT_DATA = VISION_DATA.localizedObjectAnnotations;
    if (OBJECT_DATA) {
      for (const object of OBJECT_DATA) {
        if (object.name && object.mid && object.score >= 0.2) {
          const _key = stringToASCII(object.name);
          const _score = object.score > 1 ? 0.99999 : object.score;
          const _coord: number[][] = object.boundingPoly?.normalizedVertices.map(Object.values) as number[][];
          _coord.push(_coord[0]);

          const objectID = await tagController.insert({
            _key: _key,
            mid: object.mid,
            tag: object.name,
          });

          await tagOfController.insert({
            _type: 'object',
            _key: _key + imageKey,
            _from: objectID,
            _to: imageID,
            _score: _score,
            _coord: _coord,
          });
        }
      }
    }

    /**
     * VISION LABEL ANNOTATIONS / WEB ENTITIES (@Tag & @TagOf Collection Logic)
     */
    let LABEL_DATA = VISION_DATA.labelAnnotations?.concat(
      VISION_DATA.webDetection?.webEntities ? VISION_DATA.webDetection.webEntities : [],
    );
    if (LABEL_DATA) {
      LABEL_DATA = [...new Map(LABEL_DATA.map((elem: VisionAnnotation) => [(elem.mid || elem.entityId)!, elem])).values()].sort(
        (a: VisionAnnotation, b: VisionAnnotation) => (a.score > b.score ? -1 : a.score === b.score ? 0 : 1),
      );

      // const labelTopic = LABEL_DATA.filter(obj => {
      //   const label = obj.description || obj.name;
      //   const isSafeLabel = label ? ignoredwords.indexOf(label.toLowerCase()) === -1 : false;
      //   const isOneWordLabel = label ? label.split(' ').length === 1 : false;
      //   if (isSafeLabel && isOneWordLabel) return obj;
      // })
      //   .slice(0, 5)
      //   .map(obj => obj.description || obj.name)
      //   .join(',');

      for (const labelObj of LABEL_DATA) {
        const id = labelObj.mid || labelObj.entityId;
        const label = labelObj.description || labelObj.name;

        if (id && label && labelObj.score >= 0.2) {
          const _key = stringToASCII(label);
          const _score = labelObj.score > 1 ? 0.99999 : labelObj.score;

          const labelID = await tagController.insert({
            _key: _key,
            mid: id,
            tag: label,
          });

          await tagOfController.insert({
            _type: 'label',
            _key: _key + imageKey,
            _from: labelID,
            _to: imageID,
            _score: _score,
          });
        }
      }
    }

    /**
     * @BestGuess & @BestGuessOf Collection Logic
     */
    const BESTGUESS_DATA = VISION_DATA.webDetection?.bestGuessLabels;
    if (BESTGUESS_DATA) {
      for (const guess of BESTGUESS_DATA) {
        const bestGuessID: string = await bestGuessController.insert({
          _key: stringToASCII(guess.label),
          bestGuess: guess.label,
        });

        await bestGuessOfController.insert({
          _from: bestGuessID,
          _to: imageID,
          _score: 1,
        });
      }
    }

    console.log(`${imageID} complete`);
  }

  console.log('Success: Populating DB complete.');
}

populateDB();
