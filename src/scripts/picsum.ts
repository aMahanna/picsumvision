import '../database';
import fetch from 'node-fetch';

// Import the current ArangoDB Collections in-use
import { imageObject } from '../collections/Image';
import { labelObject } from '../collections/Label/Label';
import { labelOfObject } from '../collections/Label/LabelOf';
import { authorObject } from '../collections/Author/Author';
import { authorOfObject } from '../collections/Author/AuthorOf';
import { response } from 'express';

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
  const limit = 5;
  const maxResults: number = 3;

  for (let i = 1; i < 2; i++) {
    const PICSUM_LIST_RESPONSE = await fetch(`https://picsum.photos/v2/list?page=${i}&limit=${limit}`);
    const PICSUM_LIST_RESULT = await PICSUM_LIST_RESPONSE.json();

    PICSUM_LIST_RESULT.forEach(async (PICSUM_IMAGE: PicsumImage) => {
      const PICSUM_URL: string = PICSUM_IMAGE.download_url;
      const GCP_DATA = await createGCPData(PICSUM_URL, maxResults);

      if (!GCP_DATA) return; // No metadata / GCP error implies we skip the image

      // console.log(`AUTHOR: ${PICSUM_IMAGE.author}`);
      // console.dir(GCP_DATA, { depth: null });

      // Insert Image into ArangoDB, and return its ID
      // const imageID: string = await imageObject.insertImage({
      //   id: PICSUM_IMAGE.id,
      //   author: PICSUM_IMAGE.author.toUpperCase(),
      //   url: PICSUM_URL,
      //   date: Date(),
      // });

      // /**
      //  * @this performs AUTHOR operations
      //  * @returns AUTHOR IDs
      //  */
      // const authorID: string = await authorObject.insertAuthor({
      //   fullName: PICSUM_IMAGE.author.toUpperCase(),
      //   data: PICSUM_IMAGE.author.toUpperCase().split(' '),
      // });
      // const authorOfID: string = await authorOfObject.insertAuthorOf({
      //   _from: authorID,
      //   _to: imageID,
      //   _score: 1,
      // });

      /**
       * @this performs LABEL & OBJECT operations
       * @returns "LABEL" IDs
       */
      // const GCP_LABEL_OBJECT_ANNOTATIONS : GCPAnnotation[] = GCP_DATA.labelAnnotations?.concat(GCP_DATA.localizedObjectAnnotations);
      // GCP_LABEL_OBJECT_ANNOTATIONS?.forEach(async (elem: GCPAnnotation) => {
      //   const labelID: string = await labelObject.insertLabel({
      //     mid: elem.mid,
      //     data: (elem.description || elem.name)!.toUpperCase()
      //   });
      //   const labelOfID: string = await labelOfObject.insertLabelOf({
      //     _from: labelID,
      //     _to: imageID,
      //     _score: elem.score,
      //   });
      // });
      // console.log(`Success! ${imageID}`);
    });
  }
}

generateImages();
