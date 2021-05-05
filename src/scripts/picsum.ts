/**
 * @this is a work in progress, as is with the gcp.ts @file
 * 
 * Eventually, there will only be one GCP file to use
 */

import '../database';
import fetch from 'node-fetch';

// Import the current ArangoDB Collections in-use
import { imageObject } from '../collections/Image';
import { labelObject } from '../collections/Label/Label';
import { labelOfObject } from '../collections/Label/LabelOf';
import { authorObject } from '../collections/Author/Author';
import { authorOfObject } from '../collections/Author/AuthorOf';

// Test data
import GCP_TEST_LABELS from './assets/TEST_LABELS';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

interface PicsumImage {
  id: number; // Image ID in Lorem Picsum
  author: string; // Image author
  width: number; // Image width
  height: number; // Image height
  url: string; // Image original URL (source site)
  download_url: string; // Image direct URL for download
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
  return !gcpData || Object.keys(gcpData[0]).length === 0 || gcpData[0].error ? undefined : gcpData[0];
}

async function generateImages() {
  // number of picsum images: ~1000
  const limit: number = 100;
  const maxResults: number = 3;

  let PICSUM_LIST: PicsumImage[] = [];
  for (let i = 1; i < 11; i++) {
    // const PICSUM_LIST_RESPONSE = await fetch(`https://picsum.photos/id/1048/info/`); // Used for testing
    const PICSUM_RESPONSE = await fetch(`https://picsum.photos/v2/list?page=${i}&limit=${limit}`);
    const PICSUM_RESULT = await PICSUM_RESPONSE.json();
    PICSUM_LIST = PICSUM_LIST.concat(PICSUM_RESULT);
  }

  for (let j = 0; j < PICSUM_LIST.length; j++) {
    const PICSUM_IMAGE: PicsumImage = PICSUM_LIST[j];
    const PICSUM_URL: string = PICSUM_IMAGE.download_url;

    const GCP_DATA = await createGCPData(PICSUM_URL, maxResults);
    if (!GCP_DATA) {
      console.log('SKIPPING');
      continue; // No metadata / GCP error implies we skip the image
    }

    // console.log(`URL: ${PICSUM_URL}`);
    // console.dir(GCP_DATA, { depth: null });

    /**
     * @this Inserts the Image document, and returns its ID
     * If the image already exists, it will return UNDEFINED instead, therefore skipping
     * this iteration of the loop
     */
    const imageID: string | undefined = await imageObject.insertImage({
      _key: String(PICSUM_IMAGE.id),
      author: PICSUM_IMAGE.author.toUpperCase(),
      url: PICSUM_URL,
      date: Date(),
    });
    if (!imageID) {
      console.log('DUPLICATE IMAGE');
      continue;
    }

    /**
     * @this Inserts an Author document, and links the image using an AuthorOf edge
     * @returns AUTHOR IDs
     */
    const authorData = PICSUM_IMAGE.author.toUpperCase().split(' ').join('-');
    const authorID: string = await authorObject.insertAuthor({
      _key: stringToASCII(authorData),
      data: authorData,
      nameSplit: PICSUM_IMAGE.author.toUpperCase().split(' '),
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
    const GCP_LABEL_OBJECT_ANNOTATIONS: GCPAnnotation[] = GCP_DATA.labelAnnotations
      ?.concat(GCP_DATA.localizedObjectAnnotations ? GCP_DATA.localizedObjectAnnotations : [])
      .sort((a: GCPAnnotation, b: GCPAnnotation) => (a.score > b.score ? 1 : a.score === b.score ? 0 : -1));
    const UNIQUE_LABELS: GCPAnnotation[] = [
      ...new Map(GCP_LABEL_OBJECT_ANNOTATIONS.map((elem: GCPAnnotation) => [elem.mid, elem])).values(),
    ];

    for (let t = 0; t < UNIQUE_LABELS.length; t++) {
      const elem: GCPAnnotation = UNIQUE_LABELS[t];
      const labelData = (elem.description || elem.name)!.toUpperCase().split(' ').join('-');
      const labelID: string = await labelObject.insertLabel({
        _key: stringToASCII(elem.mid),
        mid: elem.mid,
        data: labelData,
      });
      await labelOfObject.insertLabelOf({
        _from: labelID,
        _to: imageID,
        _score: elem.score,
      });
    }

    console.log(`Success! ${imageID}`);
  }
}

/**
 * Converts the passed metadata value into ASCII code
 * Used to create predictable/unique _key values for ArangoDB
 *
 * @param data A string representing the metadata value
 * @returns
 */
function stringToASCII(data: string): string {
  let _key: string = '';
  data.split('').forEach(char => {
    _key += char.charCodeAt(0);
  });
  return _key;
}

generateImages();
