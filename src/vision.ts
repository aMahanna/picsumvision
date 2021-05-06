/**
 * @this is a work in progress, as is with the picsum.ts @file
 *
 * Eventually, there will only be one Vision file to use
 */

import fetch from 'node-fetch';
import { VisionAnnotation } from './interfaces';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

/**
 *
 * @param url -- The url to target
 * @param maxResults -- The maximum number of results to get for each feature type
 * @returns An object containing the compiled metadata (@todo add its typing)
 */
async function fetchVisionMetadata(url: string, maxResults: number): Promise<any> {
  const uri = 'https://vision.googleapis.com/v1/images:annotate?' + 'key=' + process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const body = {
    requests: [
      {
        features: [
          {
            maxResults,
            type: 'LABEL_DETECTION',
          },
          {
            maxResults,
            type: 'OBJECT_LOCALIZATION',
          },
          // {
          //   maxResults,
          //   type: 'FACE_DETECTION',
          // },
          // {
          //   maxResults,
          //   type: 'SAFE_SEARCH_DETECTION',
          // },
          /**
           * @todo Prepare ArangoDB for the rest of these features:
           */
          // {
          //   maxResults,
          //   type: 'WEB_DETECTION',
          // },
          // {
          //   maxResults,
          //   type: 'IMAGE_PROPERTIES',
          // },
          // {
          //   maxResults,
          //   type: 'LANDMARK_DETECTION',
          // },
          // {
          //   maxResults,
          //   typeclear: 'LOGO_DETECTION',
          // },
          // {
          //   maxResults,
          //   type: 'TEXT_DETECTION',
          // },
        ],
        image: {
          source: {
            imageUri: url,
          },
        },
      },
    ],
  };

  const response = await fetch(uri, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const result = (await response.json()).responses;

  // Return undefined if no data was found
  return !result || Object.keys(result[0]).length === 0 ? undefined : result[0];
}

/**
 *
 * @param url The url to pass to the Vision API
 * @returns An array of labels representing the image in question
 */
export default async function parseVisionData(url: string): Promise<string | undefined> {
  const VISION_DATA = await fetchVisionMetadata(url, 3); // Set max results to 3 for now
  if (!VISION_DATA || VISION_DATA.error) {
    // Exit early if Vision does not find anything
    console.log(VISION_DATA);
    return undefined;
  }

  // Parse, sort & unify the metadata to ensure there are no conflicting values
  const VISION_LABEL_OBJECT_ANNOTATIONS: VisionAnnotation[] = VISION_DATA.labelAnnotations
    ?.concat(VISION_DATA.localizedObjectAnnotations ? VISION_DATA.localizedObjectAnnotations : [])
    .sort((a: VisionAnnotation, b: VisionAnnotation) => (a.score > b.score ? 1 : a.score === b.score ? 0 : -1));
  const UNIQUE_LABELS: VisionAnnotation[] = [
    ...new Map(VISION_LABEL_OBJECT_ANNOTATIONS.map((elem: VisionAnnotation) => [elem.mid, elem])).values(),
  ];

  // Iterate through the Unique Labels array the labels
  let labelsObject: string[] = [];
  for (let t = 0; t < UNIQUE_LABELS.length; t++) {
    const elem: VisionAnnotation = UNIQUE_LABELS[t];
    labelsObject.push((elem.description || elem.name)!.toLowerCase());
  }
  return labelsObject.join(' ');
}
