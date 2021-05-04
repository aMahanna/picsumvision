import '../database';
import fetch from 'node-fetch';
import { Picsum } from 'picsum-photos';

// Import the current ArangoDB Collections in-use
import { imageObject } from '../collections/Image';
import { labelObject } from '../collections/Label/Label';
import { labelOfObject } from '../collections/Label/LabelOf';
import { authorObject } from '../collections/Author/Author';
import { authorOfObject } from '../collections/Author/AuthorOf';

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

const MAX_RESULTS: number = 4;
async function createGCPData(picsumUrl: string): Promise<any> {
  const uri = 'https://vision.googleapis.com/v1/images:annotate?' + 'key=' + process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const body = {
    requests: [
      {
        features: [
          {
            maxResults: MAX_RESULTS,
            type: 'LABEL_DETECTION',
          },
          // {
          //   maxResults: MAX_RESULTS,
          //   type: 'WEB_DETECTION',
          // },
          /**
           * @todo Prepare ArangoDB for the rest of these features:
           */
          // {
          //   maxResults: MAX_RESULTS,
          //   type: 'IMAGE_PROPERTIES',
          // },
          // {
          //   maxResults: MAX_RESULTS,
          //   type: 'FACE_DETECTION',
          // },
          // {
          //   maxResults: MAX_RESULTS,
          //   type: 'LANDMARK_DETECTION',
          // },
          // {
          //   maxResults: MAX_RESULTS,
          //   typeclear: 'LOGO_DETECTION',
          // },
          // {
          //   maxResults: MAX_RESULTS,
          //   type: 'OBJECT_LOCALIZATION',
          // },
          // {
          //   maxResults: MAX_RESULTS,
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
  const gcpData = (await gcpResponse.json()).responses[0]; // Always returns an array with one element

  return Object.keys(gcpData).length === 0 || gcpData.error ? undefined : gcpData; // Return undefined if no data / error
}

async function generateImages() {
  for (let i = 0; i < 4; i++) {
    const PICSUM_IMAGE: PicsumImage = await Picsum.random();
    const PICSUM_URL: string = PICSUM_IMAGE.download_url;

    const GCP_DATA = await createGCPData(PICSUM_URL);
    if (!GCP_DATA) continue; // No metadata / GCP error implies we skip the image

    console.log(`IMAGE: ${PICSUM_URL}`);
    console.log(`AUTHOR: ${PICSUM_IMAGE.author}`);
    console.dir(GCP_DATA, { depth: null });

    // Insert Image into ArangoDB, and return its ID
    const imageID: string = await imageObject.insertImage({
      id: PICSUM_IMAGE.id,
      author: PICSUM_IMAGE.author.toUpperCase(),
      url: PICSUM_URL,
      date: Date(),
    });

    /**
     * @this performs AUTHOR operations
     * @returns AUTHOR IDs
     */
    const authorID: string = await authorObject.insertAuthor({
      fullName: PICSUM_IMAGE.author.toUpperCase(),
      data: PICSUM_IMAGE.author.toUpperCase().split(' '),
    });
    const authorOfID: string = await authorOfObject.insertAuthorOf({
      _from: authorID,
      _to: imageID,
      _score: 1,
    });

    /**
     * @this performs LABEL operations
     * @returns LABEL IDs
     */
    GCP_DATA.labelAnnotations.forEach(async (elem: any) => {
      const labelID: string = await labelObject.insertLabel({ mid: elem.mid, data: elem.description.toUpperCase() });
      const labelOfID: string = await labelOfObject.insertLabelOf({
        _from: labelID,
        _to: imageID,
        _score: elem.score,
      });
    });

    console.log(`Success! ${imageID}`);
  }
}

generateImages();
