/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * A script to populare the database
 *
 * For any image datset provided:
 *    - Calls the Vision API for each image to create its metadata
 *    - Inserts the image as well as author & tag documents / edges into ArrangoDB
 *    - Prints a success message on every iteration if all data is inserted
 */

import '../database';
import fetch from 'node-fetch';
import colornamer from 'color-namer';

// Import the Vision API
import fetchVisionMetadata from '../vision';
// Import the interfaces used
import { AbstractImage, PicsumImage } from '../interfaces';

// Import the current ArangoDB Collections in-use
import { imageController } from '../collections/Image';
import { authorController, authorOfController } from '../collections/Author';
import { tagController, tagOfController } from '../collections/Tag';
import { bestGuessController, bestGuessOfController } from '../collections/BestGuess';

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
 * Populates the ArangoDB with a set of images that fit the @interface AbstractImage structure
 *
 * For each Image:
 *  - Call the Vision API to fetch image classification metadata
 *  - Insert image into Image collection
 *  - Insert author relationship into Author & AuthorOf colletions
 *  - Insert Google Vision metadata into Tag & TagOf collections
 *
 * @param imageDataset An abstract set of images
 */
async function populateDB(imageDataset: AbstractImage[]) {
  console.log(`Generating metadata for ${imageDataset.length} images. Please standby...`);
  for (const image of imageDataset) {
    /**
     * @Image Collection Insertion Logic
     */
    const imageInsertResult = await imageController.insert({
      _key: image.id,
      author: image.author,
      url: image.url,
      date: Date(),
    });

    const imageID = imageInsertResult.id;
    const imageKey = imageInsertResult.id.split('/')[1];
    if (imageInsertResult.alreadyExists) {
      console.log(`Duplicate image: ${imageID}, skipping...`);
      continue; // Skip the image if it is already inserted
    }

    /**
     * @GoogleVision Metadata Generation Logic
     */
    const VISION_DATA = await fetchVisionMetadata(image.url);
    if (!VISION_DATA || VISION_DATA.error) {
      await imageController.remove(imageID);
      console.log('Vision uncooperative, skipping...', VISION_DATA?.error);
      continue; // Exit early if Vision hits an error
    }

    /**
     * @Author & @AuthorOf Collection Insertion Logic
     */
    if (image.author) {
      const authorID = await authorController.insert({
        _key: stringToASCII(image.author),
        author: image.author,
      });

      await authorOfController.insert({
        _from: authorID,
        _to: imageID,
        _score: 2,
      });
    }

    /**
     * @BestGuess & @BestGuessOf Collection Insertion Logic
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

    /**
     * @Tag & @TagOf Collection Insertion Logic - @GoogleVision LANDMARK ANNOTATIONS
     */
    const LANDMARK_DATA = VISION_DATA.landmarkAnnotations;
    if (LANDMARK_DATA) {
      for (const landmark of LANDMARK_DATA) {
        if (landmark.description && landmark.mid && landmark.score >= 0.2) {
          const _key = stringToASCII(landmark.description);
          const _score = landmark.score > 1 ? 0.99999 : landmark.score;
          const _latitude: number = landmark.locations ? landmark.locations[0].latLng.latitude : 0;
          const _longitude: number = landmark.locations ? landmark.locations[0].latLng.longitude : 0;

          try {
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
          } catch (error: any) {
            console.log('ArangoDB Error Encountered. Most likely an Illegal document key. Skipping Landmark:');
            console.dir(landmark, { depth: null });
          }
        }
      }
    }

    /**
     * @Tag & @TagOf Collection Insertion Logic - @GoogleVision LOCALIZED OBJECT ANNOTATIONS
     */
    const OBJECT_DATA = VISION_DATA.localizedObjectAnnotations;
    if (OBJECT_DATA) {
      for (const object of OBJECT_DATA) {
        if (object.name && object.mid && object.score >= 0.2) {
          const _key = stringToASCII(object.name);
          const _score = object.score > 1 ? 0.99999 : object.score;
          const _coord: number[][] = object.boundingPoly?.normalizedVertices.map(Object.values) as number[][];
          _coord.push(_coord[0]);

          try {
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
          } catch (error: any) {
            console.log('ArangoDB Error Encountered. Most likely an Illegal document key. Skipping Object:');
            console.dir(object, { depth: null });
          }
        }
      }
    }

    /**
     * @Tag & @TagOf Collection Insertion Logic - @GoogleVision WEB ENTITIES
     */
    const ENTITY_DATA = VISION_DATA.webDetection?.webEntities;
    if (ENTITY_DATA) {
      for (const entity of ENTITY_DATA) {
        if (entity.entityId && entity.description && entity.score >= 0.2) {
          const _key = stringToASCII(entity.description);
          const _score = entity.score > 1 ? 0.99999 : entity.score;

          try {
            const entityID = await tagController.insert({
              _key: _key,
              mid: entity.mid,
              tag: entity.description,
            });

            await tagOfController.insert({
              _type: 'label',
              _key: _key + imageKey,
              _from: entityID,
              _to: imageID,
              _score: _score,
            });
          } catch (error: any) {
            console.log('ArangoDB Error Encountered. Most likely an Illegal document key. Skipping Entity:');
            console.dir(entity, { depth: null });
          }
        }
      }
    }

    /**
     * @Tag & @TagOf Collection Insertion Logic - @GoogleVision LABEL ANNOTATIONS
     */
    const LABEL_DATA = VISION_DATA.labelAnnotations;
    if (LABEL_DATA) {
      for (const label of LABEL_DATA) {
        if (label.mid && label.description && label.score >= 0.2) {
          const _key = stringToASCII(label.description);
          const _score = label.score > 1 ? 0.99999 : label.score;

          try {
            const labelID = await tagController.insert({
              _key: _key,
              mid: label.mid,
              tag: label.description,
            });

            await tagOfController.insert({
              _type: 'label',
              _key: _key + imageKey,
              _from: labelID,
              _to: imageID,
              _score: _score,
            });
          } catch (error: any) {
            console.log('ArangoDB Error Encountered. Most likely an Illegal document key. Skipping Label:');
            console.dir(label, { depth: null });
          }
        }
      }
    }

    /**
     * @Tag & @TagOf Collection Insertion Logic - @GoogleVision DOMINANT COLOR ANNOTATIONS
     */
    const COLOR_DATA = VISION_DATA.imagePropertiesAnnotation?.dominantColors.colors;
    if (COLOR_DATA) {
      for (const visionColor of COLOR_DATA) {
        if (visionColor.color) {
          const colorMatch = colornamer(
            `rgb(${visionColor.color.red || 0}, ${visionColor.color.green || 0}, ${visionColor.color.blue || 0})`,
            {
              pick: ['basic'],
            },
          ).basic.filter(obj => ['black', 'gray', 'white'].indexOf(obj.name) === -1)[0];

          const colorName = colorMatch.name.charAt(0).toUpperCase() + colorMatch.name.slice(1);
          const _key = stringToASCII(colorName);
          const _score = visionColor.score;
          const _pixelFraction = visionColor.pixelFraction;

          try {
            const colorID = await tagController.insert({
              _key: _key,
              hex: colorMatch.hex,
              tag: colorName,
            });

            await tagOfController.insert({
              _type: 'label',
              _key: _key + imageKey,
              _from: colorID,
              _to: imageID,
              _score: _score,
              _pixelFraction: _pixelFraction,
            });
          } catch (error: any) {
            console.log('ArangoDB Error Encountered. Most likely an Illegal document key. Skipping Color:');
            console.dir(colorMatch, { depth: null });
          }
        }
      }
    }

    console.log(`${imageID} complete`);
  }

  console.log('Success: Populating DB complete.');
}

async function fetchLoremPicsumImages(): Promise<AbstractImage[]> {
  const limit = 100; // The number of images to return per page (max 100)

  const dataset: AbstractImage[] = [];
  let picsumResult: PicsumImage[] = [];
  let pageCount = 1;
  do {
    const picsumResponse = await fetch(`https://picsum.photos/v2/list?page=${pageCount}&limit=${limit}`);
    picsumResult = await picsumResponse.json();

    for (const picsumImage of picsumResult) {
      dataset.push({
        id: String(picsumImage.id),
        author: picsumImage.author,
        url: picsumImage.download_url,
      });
    }

    pageCount++;
  } while (picsumResult.length !== 0 && pageCount !== 2); /** @attention Remove `&& pageCount !== 2` to get all +990 images */

  return dataset;
}

/**
 * Fetches an image dataset from a source, then calls populateDB() for that dataset.
 *
 * Currently supported Image sources:
 *  1. Lorem Picsum Photos (https://picsum.photos/)
 *
 * Future supported Image sources:
 *  1. Unsplash (https://unsplash.com/)
 */
async function main() {
  const picsumDataset: AbstractImage[] = await fetchLoremPicsumImages();
  // const unsplashDataset : AbstractImage[] = await fetchUnsplashImages();

  await populateDB(picsumDataset); // Populate the database for any support image dataset
}

main();
