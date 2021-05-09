/**
 * @file Calls the Vision API for a provided url
 * Currently supported features:
 * - LABEL_DETECTION
 * - OBJECT_LOCALIZATION
 * - WEB_DETECTION
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
 * @param maxResults -- The maximum number of results to get for each feature type
 * @returns An object containing the compiled metadata (@todo add its typing)
 */
export default async function fetchVisionMetadata(url: string): Promise<VisionResult> {
  const maxResults = 5;
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
          {
            maxResults,
            type: 'WEB_DETECTION',
          },
          /**
           * @todo Prepare ArangoDB for the rest of these features:
           */
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
          //   type: 'FACE_DETECTION',
          // },
          // {
          //   maxResults,
          //   type: 'SAFE_SEARCH_DETECTION',
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
