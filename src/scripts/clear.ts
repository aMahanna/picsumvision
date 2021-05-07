/**
 * This @file clears all currently used ArangoDB collections because I'm lazy
 */

import db, { documentCollections, edgeCollections, view } from '../database';

async function clearDB() {
  for (let i = 0; i < documentCollections.length; i++) {
    console.log(`Clearing ${documentCollections[i]} collection...`);
    const documentCollection = db.collection(documentCollections[i]);
    (await documentCollection.exists()) ? await documentCollection.truncate() : '';
  }

  for (let j = 0; j < edgeCollections.length; j++) {
    console.log(`Clearing ${edgeCollections[j]} collection...`);
    const edgeCollection = db.collection(edgeCollections[j]);
    (await edgeCollection.exists()) ? await edgeCollection.truncate() : '';
  }

  console.log('Success: Collection clearing complete.');
}

clearDB();
