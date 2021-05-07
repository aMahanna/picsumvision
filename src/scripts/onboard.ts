/**
 * This @file onboards your ArangoDB.
 *
 * Run this script after you've set up your @env variables,
 * or create each collection & view through the Web Interface.
 */

import db, { documentCollections, edgeCollections, view } from '../database';
import { ViewType, CollectionType } from 'arangojs';

async function onboardDB() {
  for (let i = 0; i < documentCollections.length; i++) {
    console.log(`Configuring ${documentCollections[i]} collection...`);
    const documentCollection = db.collection(documentCollections[i]);
    (await documentCollection.exists()) ? await documentCollection.drop() : '';
    await documentCollection.create({ waitForSync: true, type: CollectionType.DOCUMENT_COLLECTION });
  }

  for (let j = 0; j < edgeCollections.length; j++) {
    console.log(`Configuring ${edgeCollections[j]} collection...`);
    const edgeCollection = db.collection(edgeCollections[j]);
    (await edgeCollection.exists()) ? await edgeCollection.drop() : '';
    await edgeCollection.create({ waitForSync: true, type: CollectionType.EDGE_COLLECTION });
  }

  console.log(`Configuring ${view}...`);
  const searchView = db.view(view);
  (await searchView.exists()) ? await searchView.drop() : '';
  await searchView.create({ type: ViewType.ARANGOSEARCH_VIEW });
  await searchView.updateProperties({
    links: {
      Authors: {
        // Connect the Author connection to the View
        analyzers: ['identity'],
        fields: {
          data: {
            // Enable English search analyzer for .data field
            analyzers: ['text_en'],
          },
          name: {
            // Enable English search analyzer for .name field
            analyzers: ['text_en'],
          },
        },
        includeAllFields: true, // All other fields are included, but are analyzed as atoms (not parsed as English words)
        storeValues: 'none',
        trackListPositions: false,
      },
      Labels: {
        // Connect the Label connection to the View
        analyzers: ['identity'],
        fields: {
          label: {
            // Enable English search analyzer for .label field
            analyzers: ['text_en'],
          },
          data: {
            // Enable English search analyzer for .data field
            analyzers: ['text_en'],
          },
        },
        includeAllFields: true, // All other fields are included, but are analyzed as atoms (not parsed as English words)
        storeValues: 'none',
        trackListPositions: false,
      },
    },
  });
  console.log('Success: Onboarding complete.');
}

onboardDB();
