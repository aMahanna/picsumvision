/**
 * @this is a work in progress, as is with the picsum.ts @file
 * 
 * Eventually, there will only be one GCP file to use
 */

import fetch from 'node-fetch';
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

interface GCPAnnotation {
  mid: string;
  name?: string;
  description?: string;
  score: number;
}

async function createGCPData(picsumUrl: string, maxResults: number): Promise<any> {
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
            imageUri: picsumUrl,
          },
        },
      },
    ],
  };

  const gcpResponse = await fetch(uri, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const gcpData = (await gcpResponse.json()).responses;

  // Return undefined if no data / error
  return !gcpData || Object.keys(gcpData[0]).length === 0 ? undefined : gcpData[0];
}

export default async function parseGCPData(url: string): Promise<string[] | undefined> {
  const GCP_DATA = await createGCPData(url, 3);
  if (!GCP_DATA || GCP_DATA.error) {
    console.log(GCP_DATA);
    return undefined;
  }

  const GCP_LABEL_OBJECT_ANNOTATIONS: GCPAnnotation[] = GCP_DATA.labelAnnotations
    ?.concat(GCP_DATA.localizedObjectAnnotations ? GCP_DATA.localizedObjectAnnotations : [])
    .sort((a: GCPAnnotation, b: GCPAnnotation) => (a.score > b.score ? 1 : a.score === b.score ? 0 : -1));
  const UNIQUE_LABELS: GCPAnnotation[] = [
    ...new Map(GCP_LABEL_OBJECT_ANNOTATIONS.map((elem: GCPAnnotation) => [elem.mid, elem])).values(),
  ];

  let labelsObject: string[] = [];
  for (let t = 0; t < UNIQUE_LABELS.length; t++) {
    const elem: GCPAnnotation = UNIQUE_LABELS[t];
    labelsObject.push((elem.description || elem.name)!.toUpperCase().split(' ').join('-'));
  }
  return labelsObject;
}
