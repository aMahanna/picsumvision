/**
 * @file Calls the Vision API for a provided url
 */

import fetch from 'node-fetch';
import { VisionResult } from './interfaces';
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  require('dotenv').config();
}

/**
 *
 * @param url -- The url to target
 * @returns An object containing the compiled metadata
 */
export default async function fetchVisionMetadata(url: string): Promise<VisionResult> {
  const uri = 'https://vision.googleapis.com/v1/images:annotate?' + 'key=' + process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const body = {
    requests: [
      {
        features: [
          {
            maxResults: 50,
            type: 'LABEL_DETECTION',
          },
          {
            maxResults: 50,
            type: 'WEB_DETECTION',
          },
          {
            maxResults: 50,
            type: 'OBJECT_LOCALIZATION',
          },
          {
            maxResults: 50,
            type: 'LANDMARK_DETECTION',
          },
          {
            maxResults: 5,
            type: 'IMAGE_PROPERTIES',
          },
          /** @todo - Maybe what's next.. */
          // {
          //   maxResults: 10,
          //   type: 'FACE_DETECTION',
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
 * @todo - remove
 * A small function to mess around with the Vision API
 */
// (async () => {
//   const visionData = await fetchVisionMetadata('https://picsum.photos/id/900/2173/1449');
//   console.dir(visionData, { depth: null });
// })();
