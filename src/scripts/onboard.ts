/* eslint-disable no-console */
/**
 * This @file onboards your ArangoDB.
 *
 * Run this script after you've set up your @env variables,
 * or create each collection & view through the Web Interface.
 */

import db, { documentCollections, edgeCollections, view } from '../database';
import { ViewType, CollectionType } from 'arangojs';
import stopwords from '../assets/misc/stopwords';

async function onboardDB() {
  for (let i = 0; i < documentCollections.length; i++) {
    console.log(`Configuring ${documentCollections[i]} collection...`);
    const documentCollection = db.collection(documentCollections[i]);
    (await documentCollection.exists()) ? await documentCollection.drop() : '';
    await documentCollection.create({ type: CollectionType.DOCUMENT_COLLECTION });
  }

  for (let j = 0; j < edgeCollections.length; j++) {
    console.log(`Configuring ${edgeCollections[j]} collection...`);
    const edgeCollection = db.collection(edgeCollections[j]);
    (await edgeCollection.exists()) ? await edgeCollection.drop() : '';
    await edgeCollection.create({ type: CollectionType.EDGE_COLLECTION });
  }

  console.log(`Configuring Custom Analyzers...`);
  const customTextAnalyzer = db.analyzer('text_en_stopwords');
  (await customTextAnalyzer.exists()) ? await customTextAnalyzer.drop(true) : '';
  await customTextAnalyzer.create({
    type: 'text',
    properties: {
      locale: 'en.utf-8',
      stemming: true,
      stopwords,
    },
  });

  const customNormAnalyzer = db.analyzer('norm_accent_lower');
  (await customNormAnalyzer.exists()) ? await customNormAnalyzer.drop(true) : '';
  await customNormAnalyzer.create({
    type: 'norm',
    properties: {
      locale: 'en.utf-8',
      accent: false,
      case: 'lower',
    },
  });

  console.log(`Configuring ${view}...`);
  const searchView = db.view(view);
  (await searchView.exists()) ? await searchView.drop() : '';
  await searchView.create({ type: ViewType.ARANGOSEARCH_VIEW });
  await searchView.updateProperties({
    links: {
      // Connect the Author vertices to the View
      Author: {
        analyzers: ['identity'], // Set default analyzer for fields not defined below
        fields: {
          author: {
            analyzers: ['text_en_stopwords', 'norm_accent_lower', 'text_en'],
          },
        },
        includeAllFields: true, // All other fields are included, but are analyzed as atoms (not parsed as English words)
        storeValues: 'none',
        trackListPositions: false,
      },
      // Connect the Tag vertices to the View
      Tag: {
        analyzers: ['identity'],
        fields: {
          tag: {
            analyzers: ['text_en_stopwords', 'norm_accent_lower', 'text_en'],
          },
          data: {
            analyzers: ['text_en_stopwords', 'text_en'],
          },
        },
        includeAllFields: true,
        storeValues: 'none',
        trackListPositions: false,
      },
      // Connect the BestGuess vertices to the View
      BestGuess: {
        analyzers: ['identity'],
        fields: {
          bestGuess: {
            // Enable English search analyzer for .bestGuess field
            analyzers: ['text_en_stopwords', 'norm_accent_lower', 'text_en'],
          },
        },
        includeAllFields: true,
        storeValues: 'none',
        trackListPositions: false,
      },
    },
  });
  console.log('Success: Onboarding complete.');
}

onboardDB();
