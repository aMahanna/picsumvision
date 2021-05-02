/* eslint-disable */
import '../database';
import { Picsum } from 'picsum-photos';

// TODO - Convert to ES6 Imports
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

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

const MAX_RESULTS: number = 1;

async function createGCPData(picsumUrl: string): Promise<any> {
  const uri = 'https://vision.googleapis.com/v1/images:annotate?' + 'key=' + process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const body = {
    requests: [
      {
        features: [
          {
            maxResults: MAX_RESULTS,
            type: 'IMAGE_PROPERTIES',
          },
          {
            maxResults: MAX_RESULTS,
            type: 'LABEL_DETECTION',
          },
          {
            maxResults: MAX_RESULTS,
            type: 'FACE_DETECTION',
          },
          {
            maxResults: MAX_RESULTS,
            type: 'LANDMARK_DETECTION',
          },
          {
            maxResults: MAX_RESULTS,
            type: 'LOGO_DETECTION',
          },
          {
            maxResults: MAX_RESULTS,
            type: 'OBJECT_LOCALIZATION',
          },
          {
            maxResults: MAX_RESULTS,
            type: 'CROP_HINTS',
          },
          {
            maxResults: MAX_RESULTS,
            type: 'WEB_DETECTION',
          },
          {
            maxResults: MAX_RESULTS,
            type: 'TEXT_DETECTION',
          },
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
  const gcpData = await gcpResponse.json();
  return gcpData;

  // const labelObjects = gcpData.responses[0].labelAnnotations;

  // if (!labelObjects)
  //   return [];

  // let labels: string[] = [];
  // gcpData.responses[0].labelAnnotations.forEach((obj: GCPLabel) => labels.push(obj.description));
  // return labels;
}

async function generateImages() {
  for (let i = 0; i < 1; i++) {
    const picsumObject: PicsumImage = await Picsum.random();
    const picsumUrl = picsumObject.download_url;
    const gcpData = await createGCPData(picsumUrl);

    if (!gcpData) {
      // GCP Could not find any labels...
      console.log('skipping...');
      continue;
    }

    console.log(picsumUrl);
    // console.dir(gcpData, { depth: null })
    console.log(JSON.stringify(gcpData));

    // const image = new ImageObject({
    //   id: uuidv4(),
    //   author: picsumObject.author,
    //   url: picsumUrl,
    //   labels: googleVisionLabels,
    //   stock: Math.floor(Math.random() * 10) + 1,
    //   price: Math.floor(Math.random() * 101) + 1,
    // });

    // image.save((err: CallbackError) => {
    //   if (err) {
    //     console.log(err);
    //     process.exit(1);
    //   } else {
    //     console.log('Success: ', i);
    //   }
    // });
  }
}

generateImages();
